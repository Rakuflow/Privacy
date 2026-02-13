#[cfg(test)]
mod tests {
    use snforge_std::{declare, deploy_syscall, cheat_caller_address_global, ContractClassTrait};
    use starknet::{ContractAddress, contract_address_const};
    use core::traits::{Into, TryInto};
    use core::option::OptionTrait;
    use core::result::ResultTrait;
    use core::array::{ArrayTrait, SpanTrait};
    use contract::incremental_merkle_tree::{IncrementalMerkleTree, IncrementalMerkleTreeTrait};
    use contract::merkle_path::{MerklePath, MerklePathTrait};
    use contract::note::{Note, NoteTrait};
    use contract::shielded_pool_interface::{IShieldedPoolDispatcher, IShieldedPoolDispatcherTrait};
    use contract::verifier_interface::{IVerifierDispatcher, IVerifierDispatcherTrait};
    use contract::utils_constants::{TREE_HEIGHT, ZERO_COMMITMENT, ZERO_VALUE, MAX_VALUE, NULLIFIER_SEED, NULLIFIER_HASH_SEED};
    use contract::utils_errors::*;
    use contract::incremental_merkle_tree::{pow2_u128, pow2_u256}; 

    #[test]
    fn test_verifier_deploy_and_verify() {
        // Deploy mock verifier
        let verifier_class = declare("GaragaVerifier").unwrap_syscall();
        let mut calldata = ArrayTrait::<felt252>::new();
        let (verifier_address, _) = deploy_syscall(verifier_class.class_hash, 0, calldata.span(), false).unwrap_syscall();
        let verifier = IVerifierDispatcher { contract_address: verifier_address };

        // Valid shielded_transfer
        let mut proof = ArrayTrait::<felt252>::new();
        proof.append(1); proof.append(2); proof.append(3);
        let mut public_inputs = ArrayTrait::<felt252>::new();
        public_inputs.append(1); public_inputs.append(2); public_inputs.append(3); public_inputs.append(4);
        let is_valid = verifier.verify_shielded_transfer(proof, public_inputs);
        assert(is_valid, 'Should be valid');

        // Invalid length
        let mut invalid_proof = ArrayTrait::<felt252>::new();
        invalid_proof.append(1); // Too short
        let is_invalid = verifier.verify_shielded_transfer(invalid_proof, public_inputs);
        assert(!is_invalid, 'Should be invalid');

        let mut withdraw_public = ArrayTrait::<felt252>::new();
        withdraw_public.append(1); withdraw_public.append(2); withdraw_public.append(3); withdraw_public.append(4); withdraw_public.append(5);
        let withdraw_valid = verifier.verify_withdraw(proof, withdraw_public);
        assert(withdraw_valid, 'Withdraw should be valid');
    }
}