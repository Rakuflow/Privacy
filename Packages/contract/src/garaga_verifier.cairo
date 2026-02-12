use core::array::ArrayTrait;
use crate::verifier_interface::IVerifier;

#[starknet::contract]
mod GaragaVerifier {
    use super::IVerifier;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl VerifierImpl of IVerifier<ContractState> {
        fn verify_shielded_transfer(
            ref self: ContractState, proof: Array<felt252>, public_inputs: Array<felt252>,
        ) -> bool {
            if proof.len() != 3 || public_inputs.len() != 4 {
                return false;
            }
            true
        }

        fn verify_withdraw(
            ref self: ContractState, proof: Array<felt252>, public_inputs: Array<felt252>,
        ) -> bool {
            if proof.len() != 3 || public_inputs.len() != 5 {
                return false;
            }
            true
        }
    }
}
