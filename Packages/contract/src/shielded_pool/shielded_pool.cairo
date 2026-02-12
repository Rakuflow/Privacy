#[starknet::contract]
mod ShieldedPool {
    use array::ArrayTrait;
    use merkle::incremental_merkle_tree::{
        IncrementalMerkleTree, MerklePath, compute_root_from_path,
    };
    use note::commitment::{Commitment, compute_commitment};
    use note::note::Note;
    use note::nullifier::{Nullifier, compute_nullifier};
    use option::OptionTrait;
    use shielded_pool::interface::{
        IShieldedPool, IShieldedPoolDispatcher, IShieldedPoolDispatcherTrait,
    };
    use starknet::class_hash::ClassHash;
    use starknet::storage::{Map, StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use token_bridge::deposit_bridge::IDepositBridgeDispatcherTrait;
    use token_bridge::withdraw_bridge::IWithdrawBridgeDispatcherTrait;
    use traits::Into;
    use utils::constants::{CHAIN_ID, TREE_HEIGHT, ZERO_COMMITMENT};
    use utils::errors::{
        ERR_INSUFFICIENT_VALUE, ERR_INVALID_CALLER, ERR_INVALID_COMMITMENT, ERR_INVALID_NULLIFIER,
        ERR_INVALID_PROOF, ERR_INVALID_ROOT, ERR_NULLIFIER_USED, ERR_VALUE_MISMATCH,
    };
    use verifier::verifier_interface::{IVerifier, IVerifierDispatcher, IVerifierDispatcherTrait};
    use zeroable::Zeroable;

    #[storage]
    struct Storage {
        merkle_tree: IncrementalMerkleTree,
        nullifier_set: Map<Nullifier, bool>,
        verifier: ContractAddress,
        token_address: ContractAddress, // ERC20 token for the pool (e.g., USDC/ETH)
        governance: ContractAddress,
        total_deposited: u256,
        leaf_count: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        NewCommitment: NewCommitment,
        NewNullifier: NewNullifier,
        RootUpdated: RootUpdated,
        Deposit: Deposit,
        Withdrawal: Withdrawal,
    }

    #[derive(Drop, starknet::Event)]
    struct NewCommitment {
        #[key]
        commitment: Commitment,
        leaf_index: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct NewNullifier {
        #[key]
        nullifier: Nullifier,
    }

    #[derive(Drop, starknet::Event)]
    struct RootUpdated {
        old_root: felt252,
        new_root: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct Deposit {
        #[key]
        from: ContractAddress,
        value: u256,
        commitment: Commitment,
    }

    #[derive(Drop, starknet::Event)]
    struct Withdrawal {
        #[key]
        to: ContractAddress,
        value: u256,
        nullifier: Nullifier,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        verifier: ContractAddress,
        token: ContractAddress,
        governance: ContractAddress,
        initial_root: felt252,
    ) {
        self.verifier.write(verifier);
        self.token_address.write(token);
        self.governance.write(governance);
        self.merkle_tree.root.write(initial_root);
        self.merkle_tree.frontiers.write(ArrayTrait::new());
        self.leaf_count.write(0);
    }

    #[abi(embed_v0)]
    impl ShieldedPoolImpl of IShieldedPool<ContractState> {
        fn shielded_transfer(
            ref self: ContractState,
            proof: Array<felt252>,
            public_inputs: Array<felt252>,
            old_root: felt252,
            new_root: felt252,
            nullifier: Nullifier,
            commitment: Commitment,
            value: u256,
        ) {
            // Check caller (support SNIP-9 outside execution, but no restriction here as privacy is
            // from zk)
            let current_root = self.merkle_tree.root.read();
            assert(old_root == current_root, ERR_INVALID_ROOT);

            assert(nullifier != Zeroable::zero(), ERR_INVALID_NULLIFIER);
            assert(!self.nullifier_set.read(nullifier), ERR_NULLIFIER_USED);

            assert(commitment != Zeroable::zero(), ERR_INVALID_COMMITMENT);

            // Verify ZK proof
            let verifier_dispatcher = IVerifierDispatcher {
                contract_address: self.verifier.read(),
            };
            let is_valid = verifier_dispatcher.verify(proof, public_inputs);
            assert(is_valid, ERR_INVALID_PROOF);

            // Append commitment to merkle tree
            let leaf_index = self.merkle_tree.append_leaf(commitment);
            self.leaf_count.write(self.leaf_count.read() + 1);

            // Update root and check match
            let computed_new_root = self.merkle_tree.root.read();
            assert(computed_new_root == new_root, 'new root mismatch');

            // Mark nullifier as used
            self.nullifier_set.write(nullifier, true);

            // Emit events
            self.emit(NewCommitment { commitment, leaf_index });
            self.emit(NewNullifier { nullifier });
            self.emit(RootUpdated { old_root, new_root: computed_new_root });
        }

        fn deposit(
            ref self: ContractState,
            proof: Array<felt252>,
            public_inputs: Array<felt252>,
            commitment: Commitment,
            value: u256,
        ) {
            let caller = get_caller_address();
            assert(value > 0, ERR_INSUFFICIENT_VALUE);

            // Transfer token from caller to contract (assume ERC20)
            // Note: In real, use IERC20Dispatcher to transferFrom(caller, self, value)

            // Verify proof for deposit (ownership, etc.)
            let verifier_dispatcher = IVerifierDispatcher {
                contract_address: self.verifier.read(),
            };
            let is_valid = verifier_dispatcher.verify(proof, public_inputs);
            assert(is_valid, ERR_INVALID_PROOF);

            // Append commitment
            let leaf_index = self.merkle_tree.append_leaf(commitment);
            self.leaf_count.write(self.leaf_count.read() + 1);
            self.total_deposited.write(self.total_deposited.read() + value);

            self.emit(Deposit { from: caller, value, commitment });
            self.emit(NewCommitment { commitment, leaf_index });
        }

        fn withdraw(
            ref self: ContractState,
            proof: Array<felt252>,
            public_inputs: Array<felt252>,
            nullifier: Nullifier,
            recipient: ContractAddress,
            value: u256,
        ) {
            assert(nullifier != Zeroable::zero(), ERR_INVALID_NULLIFIER);
            assert(!self.nullifier_set.read(nullifier), ERR_NULLIFIER_USED);
            assert(value > 0, ERR_INSUFFICIENT_VALUE);

            // Verify proof
            let verifier_dispatcher = IVerifierDispatcher {
                contract_address: self.verifier.read(),
            };
            let is_valid = verifier_dispatcher.verify(proof, public_inputs);
            assert(is_valid, ERR_INVALID_PROOF);

            // Mark nullifier
            self.nullifier_set.write(nullifier, true);

            // Transfer token to recipient
            // Note: In real, use IERC20Dispatcher to transfer(recipient, value)
            self.total_deposited.write(self.total_deposited.read() - value);

            self.emit(Withdrawal { to: recipient, value, nullifier });
            self.emit(NewNullifier { nullifier });
        }

        fn get_root(self: @ContractState) -> felt252 {
            self.merkle_tree.root.read()
        }

        fn is_nullifier_used(self: @ContractState, nullifier: Nullifier) -> bool {
            self.nullifier_set.read(nullifier)
        }

        fn get_leaf_count(self: @ContractState) -> u256 {
            self.leaf_count.read()
        }
    }
}
