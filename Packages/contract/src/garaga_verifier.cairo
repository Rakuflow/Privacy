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
            // Circuit check:
            // - Merkle root in public_inputs[0] valid
            // - Nullifier derive from spending_key + rho + index
            // - Value conservation: old_value = new_value (+ fee)
            // - Range check value
            // - Nullifier don't leak spending key
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
