#[cfg(test)]
mod tests {
    use starknet::{ContractAddress, contract_address_const};
    use core::array::ArrayTrait;
    use core::traits::Into;
    use contract::shielded_pool_interface::{IShieldedPoolDispatcher, IShieldedPoolDispatcherTrait};
    use contract::utils_constants::ZERO_COMMITMENT;
    use contract::utils_errors::{DEPOSIT_ZERO, INVALID_PROOF, INSUFFICIENT_VALUE};

    fn mock_pool() -> IShieldedPoolDispatcher {
        IShieldedPoolDispatcher { contract_address: contract_address_const::<456>() }
    }

    #[test]
    fn test_shielded_pool_deposit() {
        let pool = mock_pool();

        let amount = 100_u256;
        let rho = 1_felt252;
        let rcm = 2_felt252;
        let spending_key = 3_felt252;

        pool.deposit(amount, rho, rcm, spending_key);

        let root = pool.get_merkle_root();
        assert(root != ZERO_COMMITMENT, 'root');
    }

    #[test]
    #[should_panic(expected: ('DEPOSIT_ZERO', ))]
    fn test_shielded_pool_deposit_zero() {
        let pool = mock_pool();
        pool.deposit(0_u256, 1_felt252, 2_felt252, 3_felt252);
    }

    #[test]
    fn test_shielded_pool_transfer() {
        let pool = mock_pool();

        pool.deposit(100_u256, 1_felt252, 2_felt252, 3_felt252);

        let mut proof = ArrayTrait::<felt252>::new();
        proof.append(1); proof.append(2); proof.append(3);

        let mut public_inputs = ArrayTrait::<felt252>::new();
        public_inputs.append(pool.get_merkle_root());
        public_inputs.append(999_felt252);
        public_inputs.append(0_felt252);
        public_inputs.append(888_felt252);

        pool.shielded_transfer(proof, public_inputs);

        let is_spent = pool.is_nullifier_spent(999_felt252);
        assert(is_spent, 'spent');
    }

    #[test]
    #[should_panic(expected: ('INVALID_PROOF', ))]
    fn test_shielded_pool_transfer_invalid() {
        let pool = mock_pool();

        let mut proof = ArrayTrait::<felt252>::new();
        let mut public_inputs = ArrayTrait::<felt252>::new();
        pool.shielded_transfer(proof, public_inputs);
    }

    #[test]
    fn test_shielded_pool_withdraw() {
        let pool = mock_pool();

        pool.deposit(100_u256, 1_felt252, 2_felt252, 3_felt252);

        let mut proof = ArrayTrait::<felt252>::new();
        proof.append(1); proof.append(2); proof.append(3);

        let mut public_inputs = ArrayTrait::<felt252>::new();
        public_inputs.append(pool.get_merkle_root());
        public_inputs.append(999_felt252);
        public_inputs.append(0_felt252);
        public_inputs.append(50_u128.into());
        public_inputs.append(0_u128.into());

        let recipient = contract_address_const::<123>();
        pool.withdraw(proof, public_inputs, recipient);

        let is_spent = pool.is_nullifier_spent(999_felt252);
        assert(is_spent, 'spent');
    }

    #[test]
    #[should_panic(expected: ('INSUFFICIENT_VALUE', ))]
    fn test_shielded_pool_withdraw_insufficient() {
        let pool = mock_pool();

        let mut proof = ArrayTrait::<felt252>::new();
        proof.append(1); proof.append(2); proof.append(3);
        let mut public_inputs = ArrayTrait::<felt252>::new();
        public_inputs.append(ZERO_COMMITMENT);
        public_inputs.append(999_felt252);
        public_inputs.append(0_felt252);
        public_inputs.append(100_u128.into());
        public_inputs.append(0_u128.into());

        let recipient = contract_address_const::<123>();
        pool.withdraw(proof, public_inputs, recipient);
    }
}