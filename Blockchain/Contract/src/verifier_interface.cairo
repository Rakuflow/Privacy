#[starknet::interface]
pub trait IVerifier<TContractState> {
    fn verify_shielded_transfer(
        ref self: TContractState, proof: Array<felt252>, public_inputs: Array<felt252>,
    ) -> bool;
    fn verify_withdraw(
        ref self: TContractState, proof: Array<felt252>, public_inputs: Array<felt252>,
    ) -> bool;
}
