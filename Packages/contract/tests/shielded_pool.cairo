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

    fn deploy_shielded_pool() -> (ContractAddress, ContractAddress) {
        // Deploy verifier mock
        let verifier_class = declare("GaragaVerifier").unwrap_syscall();
        let mut calldata = ArrayTrait::<felt252>::new();
        let (verifier_address, _) = deploy_syscall(verifier_class.class_hash, 0, calldata.span(), false).unwrap_syscall();

        // Deploy shielded pool
        let pool_class = declare("ShieldedPool").unwrap_syscall();
        let mut pool_calldata = ArrayTrait::<felt252>::new();
        pool_calldata.append(verifier_address.into());
        let (pool_address, _) = deploy_syscall(pool_class.class_hash, 0, pool_calldata.span(), false).unwrap_syscall();

        (pool_address, verifier_address)
    }

    #[test]
    fn test_shielded_pool_deposit() {
        let (pool_address, _) = deploy_shielded_pool();
        let pool = IShieldedPoolDispatcher { contract_address: pool_address };

        let amount = 100_u256;
        let rho = 1_felt252;
        let rcm = 2_felt252;
        let spending_key = 3_felt252;

        cheat_caller_address_global(contract_address_const::<1>()); // Mock caller
        pool.deposit(amount, rho, rcm, spending_key);

        let root = pool.get_merkle_root();
        assert(root != ZERO_COMMITMENT, 'Root should update');
    }

    #[test]
    #[should_panic(expected: ('DEPOSIT_ZERO', ))]
    fn test_shielded_pool_deposit_zero() {
        let (pool_address, _) = deploy_shielded_pool();
        let pool = IShieldedPoolDispatcher { contract_address: pool_address };
        pool.deposit(0_u256, 1_felt252, 2_felt252, 3_felt252);
    }

    #[test]
    fn test_shielded_pool_transfer() {
        let (pool_address, _) = deploy_shielded_pool();
        let pool = IShieldedPoolDispatcher { contract_address: pool_address };

        // Deposit trước để có root
        pool.deposit(100_u256, 1_felt252, 2_felt252, 3_felt252);

        let mut proof = ArrayTrait::<felt252>::new();
        proof.append(1); proof.append(2); proof.append(3);

        let mut public_inputs = ArrayTrait::<felt252>::new();
        public_inputs.append(pool.get_merkle_root()); // root_in
        public_inputs.append(999_felt252); // nullifier_hash
        public_inputs.append(0_felt252); // placeholder
        public_inputs.append(888_felt252); // commitment_out

        pool.shielded_transfer(proof, public_inputs);

        let is_spent = pool.is_nullifier_spent(999_felt252);
        assert(is_spent, 'Nullifier should be spent');
    }

    #[test]
    #[should_panic(expected: ('INVALID_PROOF', ))]
    fn test_shielded_pool_transfer_invalid_proof() {
        let (pool_address, _) = deploy_shielded_pool();
        let pool = IShieldedPoolDispatcher { contract_address: pool_address };
        let mut proof = ArrayTrait::<felt252>::new(); // Empty proof
        let mut public_inputs = ArrayTrait::<felt252>::new();
        pool.shielded_transfer(proof, public_inputs);
    }

    #[test]
    fn test_shielded_pool_withdraw() {
        let (pool_address, _) = deploy_shielded_pool();
        let pool = IShieldedPoolDispatcher { contract_address: pool_address };

        // Deposit trước
        pool.deposit(100_u256, 1_felt252, 2_felt252, 3_felt252);

        let mut proof = ArrayTrait::<felt252>::new();
        proof.append(1); proof.append(2); proof.append(3);

        let mut public_inputs = ArrayTrait::<felt252>::new();
        public_inputs.append(pool.get_merkle_root()); // root_in
        public_inputs.append(999_felt252); // nullifier_hash
        public_inputs.append(0_felt252); // placeholder
        public_inputs.append(50_u128.into()); // amount_low
        public_inputs.append(0_u128.into()); // amount_high

        let recipient: ContractAddress = contract_address_const::<123>();
        pool.withdraw(proof, public_inputs, recipient);

        let is_spent = pool.is_nullifier_spent(999_felt252);
        assert(is_spent, 'Nullifier should be spent');
    }

    #[test]
    #[should_panic(expected: ('INSUFFICIENT_VALUE', ))]
    fn test_shielded_pool_withdraw_insufficient() {
        let (pool_address, _) = deploy_shielded_pool();
        let pool = IShieldedPoolDispatcher { contract_address: pool_address };

        // Không deposit, withdraw lớn
        let mut proof = ArrayTrait::<felt252>::new();
        proof.append(1); proof.append(2); proof.append(3);
        let mut public_inputs = ArrayTrait::<felt252>::new();
        public_inputs.append(ZERO_COMMITMENT);
        public_inputs.append(999_felt252);
        public_inputs.append(0_felt252);
        public_inputs.append(100_u128.into());
        public_inputs.append(0_u128.into());
        let recipient: ContractAddress = contract_address_const::<123>();
        pool.withdraw(proof, public_inputs, recipient);
    }
}