use core::array::{ArrayTrait, SpanTrait};
use core::integer::{u256, u32};
use core::num::traits::Zero;
use core::option::OptionTrait;
use core::poseidon::poseidon_hash_span;
use core::traits::{Into, TryInto};
use starknet::ContractAddress;
use starknet::storage::Map;
use crate::incremental_merkle_tree::{pow2_u128, pow2_u256};
use crate::note::NoteTrait;
use crate::shielded_pool_interface::IShieldedPool;
use crate::utils_constants::{TREE_HEIGHT, ZERO_COMMITMENT, ZERO_VALUE};
use crate::utils_errors::{
    DEPOSIT_ZERO, INSUFFICIENT_VALUE, INVALID_AMOUNT_PARSE, INVALID_INDEX, INVALID_PROOF,
    INVALID_ROOT, NULLIFIER_SPENT, TREE_FULL, WITHDRAW_ZERO,
};
use crate::verifier_interface::{IVerifierDispatcher, IVerifierDispatcherTrait};

#[starknet::contract]
mod ShieldedPool {
    use starknet::storage::{
        StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use super::*;

    #[derive(Drop, starknet::Event)]
    pub struct DepositEvent {
        #[key]
        commitment: felt252,
        #[key]
        leaf_index: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TransferEvent {
        #[key]
        nullifier_hash: felt252,
        #[key]
        commitment_out: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct WithdrawEvent {
        #[key]
        nullifier_hash: felt252,
        #[key]
        recipient: ContractAddress,
        #[key]
        amount: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        DepositEvent: DepositEvent,
        TransferEvent: TransferEvent,
        WithdrawEvent: WithdrawEvent,
    }

    #[storage]
    struct Storage {
        _verifier: ContractAddress,
        _merkle_root: felt252,
        _commitments_count: u256,
        _frontiers: Map<u32, felt252>,
        _commitments: Map<u256, felt252>,
        _nullifiers: Map<felt252, bool>,
        _total_supply: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, verifier: ContractAddress) {
        self._verifier.write(verifier);
        self._merkle_root.write(ZERO_COMMITMENT);
        self._commitments_count.write(0_u256);
        self._total_supply.write(0_u256);

        let mut i: u32 = 0;
        loop {
            if i >= TREE_HEIGHT.try_into().unwrap() {
                break;
            }
            self._frontiers.write(i, ZERO_COMMITMENT);
            i += 1;
        }
    }

    #[abi(embed_v0)]
    impl ShieldedPoolImpl of IShieldedPool<ContractState> {
        fn deposit(
            ref self: ContractState,
            amount: u256,
            rho: felt252,
            rcm: felt252,
            spending_key: felt252,
        ) {
            assert(amount > ZERO_VALUE, DEPOSIT_ZERO);

            let note = NoteTrait::new(amount, rho, rcm, spending_key);
            let commitment = note.commitment();

            let leaf_index = self._commitments_count.read();
            self._commitments.write(leaf_index, commitment);

            self.append_commitment(commitment);

            self._total_supply.write(self._total_supply.read() + amount);

            self.emit(Event::DepositEvent(DepositEvent { commitment, leaf_index }));
        }

        fn shielded_transfer(
            ref self: ContractState, proof: Array<felt252>, public_inputs: Array<felt252>,
        ) {
            assert(proof.len() >= 1 && public_inputs.len() == 3, INVALID_PROOF);

            let verifier = IVerifierDispatcher { contract_address: self._verifier.read() };
            let is_valid = verifier.verify_shielded_transfer(proof, public_inputs.clone());
            assert(is_valid, INVALID_PROOF);

            let root_in = *public_inputs.at(0);
            let nullifier_hash = *public_inputs.at(1);
            let commitment_out = *public_inputs.at(2);

            assert(self._merkle_root.read() == root_in, INVALID_ROOT);

            let spent = self._nullifiers.read(nullifier_hash);
            assert(!spent, NULLIFIER_SPENT);
            self._nullifiers.write(nullifier_hash, true);

            let leaf_index = self._commitments_count.read();
            self._commitments.write(leaf_index, commitment_out);

            self.append_commitment(commitment_out);

            self.emit(Event::TransferEvent(TransferEvent { nullifier_hash, commitment_out }));
        }

        fn withdraw(
            ref self: ContractState,
            proof: Array<felt252>,
            public_inputs: Array<felt252>,
            recipient: ContractAddress,
        ) {
            assert(proof.len() >= 1 && public_inputs.len() == 5, INVALID_PROOF);
            assert(!recipient.is_zero(), WITHDRAW_ZERO);

            let verifier = IVerifierDispatcher { contract_address: self._verifier.read() };
            let is_valid = verifier.verify_withdraw(proof, public_inputs.clone());
            assert(is_valid, INVALID_PROOF);

            let root_in = *public_inputs.at(0);
            let nullifier_hash = *public_inputs.at(1);
            let amount_low_felt = *public_inputs.at(2);
            let amount_high_felt = *public_inputs.at(3);

            let amount_low: u128 = amount_low_felt.try_into().expect(INVALID_AMOUNT_PARSE);
            let amount_high: u128 = amount_high_felt.try_into().expect(INVALID_AMOUNT_PARSE);

            let amount = u256 { low: amount_low, high: amount_high };

            assert(self._merkle_root.read() == root_in, INVALID_ROOT);

            let spent = self._nullifiers.read(nullifier_hash);
            assert(!spent, NULLIFIER_SPENT);
            self._nullifiers.write(nullifier_hash, true);

            let current_supply = self._total_supply.read();
            assert(current_supply >= amount, INSUFFICIENT_VALUE);
            self._total_supply.write(current_supply - amount);

            self.emit(Event::WithdrawEvent(WithdrawEvent { nullifier_hash, recipient, amount }));
        }

        fn get_merkle_root(ref self: ContractState) -> felt252 {
            self._merkle_root.read()
        }

        fn is_nullifier_spent(ref self: ContractState, nullifier_hash: felt252) -> bool {
            self._nullifiers.read(nullifier_hash)
        }

        // calculate siblings with recurse full fot subtree hash. Frontend get path
        // for circuit.
        fn get_merkle_path(ref self: ContractState, index: u256) -> Array<felt252> {
            let commitments_count = self._commitments_count.read();
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
                            sibling_index, TREE_HEIGHT - current_level - 1,
                        ) // Recurse for subtree depth
                } else {
                    let sibling_index = current_index - pow2_u256(current_level);
                    self.compute_hash_at_index(sibling_index, TREE_HEIGHT - current_level - 1)
                };
                siblings.append(sibling_hash);
                current_level += 1;
            }
            siblings
        }
    }

    #[generate_trait]
    pub impl Internal of InternalTrait {
        // Base: If depth=0 (leaf), return commitment; else hash left + right child.
        fn compute_hash_at_index(
            ref self: ContractState, mut node_index: u256, remaining_depth: usize,
        ) -> felt252 {
            if remaining_depth == 0 {
                // Leaf: Lookup commitment
                let commitments_count = self._commitments_count.read();
                if node_index >= commitments_count {
                    ZERO_COMMITMENT
                } else {
                    self._commitments.read(node_index)
                }
            } else {
                // Internal node: Recurse left (2*index) và right (2*index+1)
                let left_hash = self
                    .compute_hash_at_index(node_index * 2_u256, remaining_depth - 1);
                let right_hash = self
                    .compute_hash_at_index(node_index * 2_u256 + 1_u256, remaining_depth - 1);
                // Hash Poseidon left + right
                let mut hash_input = ArrayTrait::<felt252>::new();
                hash_input.append(left_hash);
                hash_input.append(right_hash);
                poseidon_hash_span(hash_input.span())
            }
        }

        fn append_commitment(ref self: ContractState, commitment: felt252) {
            let next_leaf_index = self._commitments_count.read();
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
                let sibling = self._frontiers.read(level_u32);

                let shift = pow2_u128(level);
                let is_right = ((index.low / shift) % 2_u128) != 0_u128;

                let mut hash_input: Array<felt252> = ArrayTrait::new();
                if is_right {
                    hash_input.append(sibling);
                    hash_input.append(current);
                } else {
                    hash_input.append(current);
                    hash_input.append(sibling);
                }
                current = poseidon_hash_span(hash_input.span());

                if level < TREE_HEIGHT - 1 {
                    self._frontiers.write(level_u32, current);
                }

                level += 1;
            }

            self._merkle_root.write(current);
            self._commitments_count.write(next_leaf_index + 1_u256);
        }
    }
}
