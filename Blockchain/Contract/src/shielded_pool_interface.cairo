use core::integer::u256;
use starknet::ContractAddress;

#[starknet::interface]
pub trait IShieldedPool<TContractState> {
    fn add_supported_token(ref self: TContractState, token: ContractAddress, decimals: u8);
    fn remove_supported_token(ref self: TContractState, token: ContractAddress);
    fn is_supported_token(ref self: TContractState, token: ContractAddress) -> bool;
    fn get_token_decimals(ref self: TContractState, token: ContractAddress) -> u8;

    fn deposit(
        ref self: TContractState,
        token: ContractAddress,
        amount: u256,
        rho: felt252,
        rcm: felt252,
        spending_key: felt252,
    );
    fn shielded_transfer(
        ref self: TContractState,
        token: ContractAddress,
        proof: Array<felt252>,
        public_inputs: Array<felt252>,
    );
    fn withdraw(
        ref self: TContractState,
        token: ContractAddress,
        proof: Array<felt252>,
        public_inputs: Array<felt252>,
        recipient: ContractAddress,
    );
    fn get_merkle_root(ref self: TContractState, token: ContractAddress) -> felt252;
    fn get_merkle_path(
        ref self: TContractState, token: ContractAddress, index: u256,
    ) -> Array<felt252>;
    fn is_nullifier_spent(
        ref self: TContractState, token: ContractAddress, nullifier_hash: felt252,
    ) -> bool;
}
