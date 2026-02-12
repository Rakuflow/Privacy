use core::array::ArrayTrait;
use core::integer::u256;
use starknet::ContractAddress;

#[starknet::interface]
pub trait IShieldedPool<TContractState> {
    fn deposit(ref self: TContractState, amount: u256, rho: felt252, rcm: felt252);
    fn shielded_transfer(
        ref self: TContractState, proof: Array<felt252>, public_inputs: Array<felt252>,
    );
    fn withdraw(
        ref self: TContractState,
        proof: Array<felt252>,
        public_inputs: Array<felt252>,
        recipient: ContractAddress,
    );
    fn get_merkle_root(ref self: TContractState) -> felt252;
    fn is_nullifier_spent(ref self: TContractState, nullifier_hash: felt252) -> bool;
}
