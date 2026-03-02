use core::array::{ArrayTrait, SpanTrait};
use core::integer::u256;
use core::num::traits::Zero;
use core::option::OptionTrait;
use core::traits::TryInto;
use starknet::ContractAddress;
use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
use crate::noir_backend_interface::{
    INoirBackendVerifierDispatcher, INoirBackendVerifierDispatcherTrait,
};
use crate::verifier_interface::IVerifier;

#[starknet::contract]
mod GaragaVerifier {
    use super::{
        ArrayTrait, ContractAddress, INoirBackendVerifierDispatcher,
        INoirBackendVerifierDispatcherTrait, IVerifier, OptionTrait, SpanTrait,
        StoragePointerReadAccess, StoragePointerWriteAccess, TryInto, Zero, u256,
    };

    #[storage]
    struct Storage {
        _transfer_backend: ContractAddress,
        _withdraw_backend: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        transfer_backend: ContractAddress,
        withdraw_backend: ContractAddress,
    ) {
        assert(!transfer_backend.is_zero(), 'INVALID_TRANSFER_VERIFIER');
        assert(!withdraw_backend.is_zero(), 'INVALID_WITHDRAW_VERIFIER');
        self._transfer_backend.write(transfer_backend);
        self._withdraw_backend.write(withdraw_backend);
    }

    #[abi(embed_v0)]
    impl VerifierImpl of IVerifier<ContractState> {
        fn verify_shielded_transfer(
            ref self: ContractState, proof: Array<felt252>, public_inputs: Array<felt252>,
        ) -> bool {
            // Transfer circuit public inputs:
            // [0] root, [1] nullifier_hash, [2] new_commitment
            if proof.len() == 0 || public_inputs.len() != 3 {
                return false;
            }

            let backend = INoirBackendVerifierDispatcher {
                contract_address: self._transfer_backend.read(),
            };
            match backend.verify_ultra_keccak_zk_honk_proof(proof.span()) {
                Result::Ok(actual_public_inputs) => {
                    self.match_public_inputs(actual_public_inputs, public_inputs.span())
                },
                Result::Err(_) => false,
            }
        }

        fn verify_withdraw(
            ref self: ContractState, proof: Array<felt252>, public_inputs: Array<felt252>,
        ) -> bool {
            // Withdraw circuit public inputs:
            // [0] root, [1] nullifier_hash, [2] amount_low, [3] amount_high, [4] recipient
            if proof.len() == 0 || public_inputs.len() != 5 {
                return false;
            }

            let backend = INoirBackendVerifierDispatcher {
                contract_address: self._withdraw_backend.read(),
            };
            match backend.verify_ultra_keccak_zk_honk_proof(proof.span()) {
                Result::Ok(actual_public_inputs) => {
                    self.match_public_inputs(actual_public_inputs, public_inputs.span())
                },
                Result::Err(_) => false,
            }
        }
    }

    #[generate_trait]
    impl Internal of InternalTrait {
        fn match_public_inputs(
            self: @ContractState,
            actual_public_inputs: Span<u256>,
            expected_public_inputs: Span<felt252>,
        ) -> bool {
            if actual_public_inputs.len() != expected_public_inputs.len() {
                return false;
            }

            let mut i: usize = 0;
            loop {
                if i >= expected_public_inputs.len() {
                    break;
                }

                let expected_felt = *expected_public_inputs.at(i);
                let expected_u256: u256 = expected_felt.try_into().expect('INVALID_PUBLIC_INPUT');
                let actual_u256 = *actual_public_inputs.at(i);

                if expected_u256 != actual_u256 {
                    return false;
                }

                i += 1;
            }

            true
        }
    }
}
