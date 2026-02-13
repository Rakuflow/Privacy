#[cfg(test)]
mod tests {
    use snforge_std::{declare, deploy_syscall, ContractClassTrait};
    use starknet::{SyscallResultTrait, ClassHash};
    use core::array::ArrayTrait;
    use contract::verifier_interface::{IVerifierDispatcher, IVerifierDispatcherTrait};

    #[test]
    fn test_verifier_deploy_and_verify() {
        let class = declare("GaragaVerifier").unwrap_syscall();
        let class_hash: ClassHash = class.class_hash;  // khai báo riêng để compiler nhận

        let mut calldata = ArrayTrait::<felt252>::new();
        let (verifier_address, _) = deploy_syscall(class_hash, 0, calldata.span(), false).unwrap_syscall();

        let verifier = IVerifierDispatcher { contract_address: verifier_address };

        let mut proof = ArrayTrait::<felt252>::new();
        proof.append(1); proof.append(2); proof.append(3);
        let mut public_inputs = ArrayTrait::<felt252>::new();
        public_inputs.append(1); public_inputs.append(2); public_inputs.append(3); public_inputs.append(4);

        let is_valid = verifier.verify_shielded_transfer(proof, public_inputs);
        assert(is_valid, 'valid');

        let mut invalid_proof = ArrayTrait::<felt252>::new();
        invalid_proof.append(1);
        let is_invalid = verifier.verify_shielded_transfer(invalid_proof, public_inputs);
        assert(!is_invalid, 'invalid');

        let mut withdraw_public = ArrayTrait::<felt252>::new();
        withdraw_public.append(1); withdraw_public.append(2); withdraw_public.append(3); withdraw_public.append(4); withdraw_public.append(5);
        let is_valid_withdraw = verifier.verify_withdraw(proof, withdraw_public);
        assert(is_valid_withdraw, 'valid');
    }
}