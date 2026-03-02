use core::array::ArrayTrait;
use core::integer::{u128, u256};
use core::num::traits::Zero;
use core::poseidon::poseidon_hash_span;
use core::traits::{Into, TryInto};
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use starknet::storage::{Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess};
use starknet::{ContractAddress, get_caller_address, get_contract_address};
use crate::incremental_merkle_tree::{pow2_u128, pow2_u256};
use crate::note::NoteTrait;
use crate::shielded_pool_interface::IShieldedPool;
use crate::utils_constants::{MAX_VALUE, TREE_HEIGHT, ZERO_COMMITMENT, ZERO_VALUE};
use crate::utils_errors::*;
use crate::verifier_interface::{IVerifierDispatcher, IVerifierDispatcherTrait};

#[starknet::contract]
mod ShieldedPool {
    use super::*;

    const FRONTIER_KEY_SEED: felt252 = 1001_felt252;
    const COMMITMENT_KEY_SEED: felt252 = 1002_felt252;
    const NULLIFIER_KEY_SEED: felt252 = 1003_felt252;

    #[derive(Drop, starknet::Event)]
    pub struct TokenSupportUpdated {
        #[key]
        token: ContractAddress,
        enabled: bool,
        decimals: u8,
    }

    #[derive(Drop, starknet::Event)]
    pub struct DepositEvent {
        #[key]
        token: ContractAddress,
        #[key]
        commitment: felt252,
        #[key]
        leaf_index: u256,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TransferEvent {
        #[key]
        token: ContractAddress,
        #[key]
        nullifier_hash: felt252,
        #[key]
        commitment_out: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct WithdrawEvent {
        #[key]
        token: ContractAddress,
        #[key]
        nullifier_hash: felt252,
        #[key]
        recipient: ContractAddress,
        amount: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TokenSupportUpdated: TokenSupportUpdated,
        DepositEvent: DepositEvent,
        TransferEvent: TransferEvent,
        WithdrawEvent: WithdrawEvent,
    }

    #[storage]
    struct Storage {
        _owner: ContractAddress,
        _verifier: ContractAddress,
        _supported_tokens: Map<ContractAddress, bool>,
        _token_decimals: Map<ContractAddress, u8>,
        _merkle_roots: Map<ContractAddress, felt252>,
        _commitments_count: Map<ContractAddress, u256>,
        _frontiers: Map<felt252, felt252>,
        _commitments: Map<felt252, felt252>,
        _nullifiers: Map<felt252, bool>,
        _total_locked: Map<ContractAddress, u256>,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        verifier: ContractAddress,
        initial_token: ContractAddress,
        initial_token_decimals: u8,
    ) {
        self._owner.write(get_caller_address());
        self._verifier.write(verifier);
        self.enable_token(initial_token, initial_token_decimals);
    }

    #[abi(embed_v0)]
    impl ShieldedPoolImpl of IShieldedPool<ContractState> {
        fn add_supported_token(ref self: ContractState, token: ContractAddress, decimals: u8) {
            self.assert_owner();
            self.enable_token(token, decimals);
        }

        fn remove_supported_token(ref self: ContractState, token: ContractAddress) {
            self.assert_owner();
            assert(!token.is_zero(), INVALID_TOKEN);

            let locked = self._total_locked.entry(token).read();
            assert(locked == ZERO_VALUE, TOKEN_LOCKED);

            self._supported_tokens.entry(token).write(false);
            let decimals = self._token_decimals.entry(token).read();
            self
                .emit(
                    Event::TokenSupportUpdated(
                        TokenSupportUpdated { token, enabled: false, decimals },
                    ),
                );
        }

        fn is_supported_token(ref self: ContractState, token: ContractAddress) -> bool {
            self._supported_tokens.entry(token).read()
        }

        fn get_token_decimals(ref self: ContractState, token: ContractAddress) -> u8 {
            self.assert_supported_token(token);
            self._token_decimals.entry(token).read()
        }

        fn deposit(
            ref self: ContractState,
            token: ContractAddress,
            amount: u256,
            rho: felt252,
            rcm: felt252,
            spending_key: felt252,
        ) {
            self.assert_supported_token(token);
            assert(amount > ZERO_VALUE && amount <= MAX_VALUE, INVALID_COMMITMENT);

            let caller = get_caller_address();
            let this = get_contract_address();
            let erc20 = IERC20Dispatcher { contract_address: token };

            erc20.transfer_from(caller, this, amount);

            let note = NoteTrait::new(amount, rho, rcm, spending_key);
            let commitment = note.commitment();

            let leaf_index = self._commitments_count.entry(token).read();
            let leaf_key = self.commitment_key(token, leaf_index);
            self._commitments.entry(leaf_key).write(commitment);
            self.append_commitment(token, commitment);

            self._total_locked.entry(token).write(self._total_locked.entry(token).read() + amount);

            self.emit(Event::DepositEvent(DepositEvent { token, commitment, leaf_index, amount }));
        }

        fn shielded_transfer(
            ref self: ContractState,
            token: ContractAddress,
            proof: Array<felt252>,
            public_inputs: Array<felt252>,
        ) {
            self.assert_supported_token(token);
            // Expected public inputs:
            // 0: root
            // 1: nullifier_hash
            // 2: new_commitment
            assert(proof.len() >= 1 && public_inputs.len() == 3, INVALID_PROOF);

            let verifier = IVerifierDispatcher { contract_address: self._verifier.read() };
            assert(verifier.verify_shielded_transfer(proof, public_inputs.clone()), INVALID_PROOF);

            let root = *public_inputs.at(0);
            let nullifier_hash = *public_inputs.at(1);
            let new_commitment = *public_inputs.at(2);

            assert(self._merkle_roots.entry(token).read() == root, INVALID_ROOT);

            let nullifier_key = self.nullifier_key(token, nullifier_hash);
            assert(!self._nullifiers.entry(nullifier_key).read(), NULLIFIER_SPENT);
            self._nullifiers.entry(nullifier_key).write(true);

            let new_index = self._commitments_count.entry(token).read();
            let commitment_key = self.commitment_key(token, new_index);
            self._commitments.entry(commitment_key).write(new_commitment);
            self.append_commitment(token, new_commitment);

            self
                .emit(
                    Event::TransferEvent(
                        TransferEvent { token, nullifier_hash, commitment_out: new_commitment },
                    ),
                );
        }

        fn withdraw(
            ref self: ContractState,
            token: ContractAddress,
            proof: Array<felt252>,
            public_inputs: Array<felt252>,
            recipient: ContractAddress,
        ) {
            self.assert_supported_token(token);
            assert(!recipient.is_zero(), WITHDRAW_ZERO);
            assert(proof.len() >= 1 && public_inputs.len() == 5, INVALID_PROOF);

            let verifier = IVerifierDispatcher { contract_address: self._verifier.read() };
            assert(verifier.verify_withdraw(proof, public_inputs.clone()), INVALID_PROOF);

            let root = *public_inputs.at(0);
            let nullifier_hash = *public_inputs.at(1);
            let amount_low: u128 = (*public_inputs.at(2)).try_into().expect(INVALID_AMOUNT_PARSE);
            let amount_high: u128 = (*public_inputs.at(3)).try_into().expect(INVALID_AMOUNT_PARSE);
            let amount = u256 { low: amount_low, high: amount_high };

            assert(self._merkle_roots.entry(token).read() == root, INVALID_ROOT);

            let nullifier_key = self.nullifier_key(token, nullifier_hash);
            assert(!self._nullifiers.entry(nullifier_key).read(), NULLIFIER_SPENT);
            self._nullifiers.entry(nullifier_key).write(true);

            let locked = self._total_locked.entry(token).read();
            assert(locked >= amount, INSUFFICIENT_VALUE);
            self._total_locked.entry(token).write(locked - amount);

            let erc20 = IERC20Dispatcher { contract_address: token };
            erc20.transfer(recipient, amount);

            self
                .emit(
                    Event::WithdrawEvent(
                        WithdrawEvent { token, nullifier_hash, recipient, amount },
                    ),
                );
        }

        fn get_merkle_root(ref self: ContractState, token: ContractAddress) -> felt252 {
            self.assert_supported_token(token);
            self._merkle_roots.entry(token).read()
        }

        fn is_nullifier_spent(
            ref self: ContractState, token: ContractAddress, nullifier_hash: felt252,
        ) -> bool {
            self.assert_supported_token(token);
            let nullifier_key = self.nullifier_key(token, nullifier_hash);
            self._nullifiers.entry(nullifier_key).read()
        }

        fn get_merkle_path(
            ref self: ContractState, token: ContractAddress, index: u256,
        ) -> Array<felt252> {
            self.assert_supported_token(token);
            let commitments_count = self._commitments_count.entry(token).read();
            assert(index < commitments_count, INVALID_INDEX);
            let mut siblings = ArrayTrait::<felt252>::new();
            let mut current_level: usize = 0;
            let mut current_index = index;
            loop {
                if current_level == TREE_HEIGHT {
                    break;
                }
                let shift = pow2_u128(current_level);
                let is_left_u128 = (current_index.low / shift) % 2_u128;
                let is_left = is_left_u128.into();
                let sibling_hash = if is_left == 0 {
                    let sibling_index = current_index + pow2_u256(current_level);
                    self
                        .compute_hash_at_index(
                            token, sibling_index, TREE_HEIGHT - current_level - 1,
                        )
                } else {
                    let sibling_index = current_index - pow2_u256(current_level);
                    self
                        .compute_hash_at_index(
                            token, sibling_index, TREE_HEIGHT - current_level - 1,
                        )
                };
                siblings.append(sibling_hash);
                current_level += 1;
            }
            siblings
        }
    }

    #[generate_trait]
    impl Internal of InternalTrait {
        fn assert_owner(self: @ContractState) {
            assert(get_caller_address() == self._owner.read(), UNAUTHORIZED);
        }

        fn assert_supported_token(self: @ContractState, token: ContractAddress) {
            assert(!token.is_zero(), INVALID_TOKEN);
            assert(self._supported_tokens.entry(token).read(), TOKEN_NOT_SUPPORTED);
        }

        fn enable_token(ref self: ContractState, token: ContractAddress, decimals: u8) {
            assert(!token.is_zero(), INVALID_TOKEN);
            self._supported_tokens.entry(token).write(true);
            self._token_decimals.entry(token).write(decimals);
            self
                .emit(
                    Event::TokenSupportUpdated(
                        TokenSupportUpdated { token, enabled: true, decimals },
                    ),
                );
        }

        fn frontier_key(self: @ContractState, token: ContractAddress, level: u32) -> felt252 {
            let token_felt: felt252 = token.into();
            let mut input = array![FRONTIER_KEY_SEED, token_felt, level.into()];
            poseidon_hash_span(input.span())
        }

        fn commitment_key(self: @ContractState, token: ContractAddress, index: u256) -> felt252 {
            let token_felt: felt252 = token.into();
            let mut input = array![
                COMMITMENT_KEY_SEED, token_felt, index.low.into(), index.high.into(),
            ];
            poseidon_hash_span(input.span())
        }

        fn nullifier_key(
            self: @ContractState, token: ContractAddress, nullifier_hash: felt252,
        ) -> felt252 {
            let token_felt: felt252 = token.into();
            let mut input = array![NULLIFIER_KEY_SEED, token_felt, nullifier_hash];
            poseidon_hash_span(input.span())
        }

        fn compute_hash_at_index(
            self: @ContractState, token: ContractAddress, node_index: u256, remaining_depth: usize,
        ) -> felt252 {
            if remaining_depth == 0 {
                let commitments_count = self._commitments_count.entry(token).read();
                if node_index >= commitments_count {
                    ZERO_COMMITMENT
                } else {
                    let commitment_key = self.commitment_key(token, node_index);
                    self._commitments.entry(commitment_key).read()
                }
            } else {
                let left_hash = self
                    .compute_hash_at_index(token, node_index * 2_u256, remaining_depth - 1);
                let right_hash = self
                    .compute_hash_at_index(
                        token, node_index * 2_u256 + 1_u256, remaining_depth - 1,
                    );
                let mut hash_input = array![left_hash, right_hash];
                poseidon_hash_span(hash_input.span())
            }
        }

        fn append_commitment(ref self: ContractState, token: ContractAddress, commitment: felt252) {
            let next_leaf_index = self._commitments_count.entry(token).read();
            let max_leaves = pow2_u256(TREE_HEIGHT);
            assert(next_leaf_index < max_leaves, TREE_FULL);

            let mut current = commitment;
            let mut index = next_leaf_index;
            let mut level: usize = 0;

            loop {
                if level == TREE_HEIGHT {
                    break;
                }

                let level_u32: u32 = level.try_into().unwrap();
                let frontier_key = self.frontier_key(token, level_u32);
                let sibling = self._frontiers.entry(frontier_key).read();

                let shift = pow2_u128(level);
                let is_right = ((index.low / shift) % 2_u128) != 0_u128;

                let mut hash_input = array![];
                if is_right {
                    hash_input.append(sibling);
                    hash_input.append(current);
                } else {
                    hash_input.append(current);
                    hash_input.append(sibling);
                }
                current = poseidon_hash_span(hash_input.span());

                if level < TREE_HEIGHT - 1 {
                    self._frontiers.entry(frontier_key).write(current);
                }

                level += 1;
            }

            self._merkle_roots.entry(token).write(current);
            self._commitments_count.entry(token).write(next_leaf_index + 1_u256);
        }
    }
}
