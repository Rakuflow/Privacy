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
    DEPOSIT_ZERO, INSUFFICIENT_VALUE, INVALID_PROOF, INVALID_ROOT, NULLIFIER_SPENT, TREE_FULL,
    WITHDRAW_ZERO,
};
use crate::verifier_interface::{IVerifierDispatcher, IVerifierDispatcherTrait};

#[starknet::contract]
mod ShieldedPool {
    use starknet::storage::{
        StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use crate::utils_errors::INVALID_AMOUNT_PARSE;
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

            // let mut spending_key_hasher = ArrayTrait::new();
            // spending_key_hasher.append(rho);
            // spending_key_hasher.append(rcm);
            // let spending_key = poseidon_hash_span(spending_key_hasher.span());

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
            assert(proof.len() >= 1 && public_inputs.len() >= 4, INVALID_PROOF);

            let verifier = IVerifierDispatcher { contract_address: self._verifier.read() };
            let is_valid = verifier.verify_shielded_transfer(proof, public_inputs.clone());
            assert(is_valid, INVALID_PROOF);

            let root_in = *public_inputs.at(0);
            let nullifier_hash = *public_inputs.at(1);
            let commitment_out = *public_inputs.at(3);

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
            assert(proof.len() >= 1 && public_inputs.len() >= 5, INVALID_PROOF);
            assert(!recipient.is_zero(), WITHDRAW_ZERO);

            let verifier = IVerifierDispatcher { contract_address: self._verifier.read() };
            let is_valid = verifier.verify_withdraw(proof, public_inputs.clone());
            assert(is_valid, INVALID_PROOF);

            let root_in = *public_inputs.at(0);
            let nullifier_hash = *public_inputs.at(1);
            let amount_low_felt = *public_inputs.at(3);
            let amount_high_felt = *public_inputs.at(4);

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
    }

    #[generate_trait]
    impl Internal of InternalTrait {
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
