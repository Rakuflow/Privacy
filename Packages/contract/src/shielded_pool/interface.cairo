use array::ArrayTrait;
use starknet::ContractAddress;

#[starknet::interface]
trait IShieldedPool<TContractState> {
    fn shielded_transfer(
        ref self: TContractState,
        proof: Array<felt252>,
        public_inputs: Array<felt252>,
        old_root: felt252,
        new_root: felt252,
        nullifier: felt252,
        commitment: felt252,
        value: u256,
    );

    fn deposit(
        ref self: TContractState,
        proof: Array<felt252>,
        public_inputs: Array<felt252>,
        commitment: felt252,
        value: u256,
    );

    fn withdraw(
        ref self: TContractState,
        proof: Array<felt252>,
        public_inputs: Array<felt252>,
        nullifier: felt252,
        recipient: ContractAddress,
        value: u256,
    );

    fn get_root(self: @TContractState) -> felt252;
    fn is_nullifier_used(self: @TContractState, nullifier: felt252) -> bool;
    fn get_leaf_count(self: @TContractState) -> u256;
}
