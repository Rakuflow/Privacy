use array::ArrayTrait;

#[starknet::interface]
trait IVerifier<TContractState> {
    fn verify(self: @TContractState, proof: Array<felt252>, public_inputs: Array<felt252>) -> bool;
}
