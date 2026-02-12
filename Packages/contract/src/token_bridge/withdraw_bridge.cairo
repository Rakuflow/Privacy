use array::ArrayTrait;
use option::OptionTrait;
use shielded_pool::interface::{IShieldedPoolDispatcher, IShieldedPoolDispatcherTrait};
use starknet::storage::{Map, StoragePointerReadAccess, StoragePointerWriteAccess};
use starknet::{ContractAddress, get_caller_address, get_contract_address};
use traits::{Into, TryInto};
use utils::errors::{ERR_CALLER_NOT_AUTHORIZED, ERR_INVALID_VALUE, ERR_TOKEN_NOT_SUPPORTED};
use zeroable::Zeroable;

#[starknet::interface]
trait IERC20<TContractState> {
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256);
}

#[starknet::interface]
trait IWithdrawBridge<TContractState> {
    fn withdraw(
        ref self: TContractState,
        token: ContractAddress,
        recipient: ContractAddress,
        value: u256,
        nullifier: felt252,
        proof: Array<felt252>,
        public_inputs: Array<felt252>,
    );

    fn add_supported_token(ref self: TContractState, token: ContractAddress);
    fn remove_supported_token(ref self: TContractState, token: ContractAddress);
    fn is_supported_token(self: @TContractState, token: ContractAddress) -> bool;
}

#[starknet::contract]
mod WithdrawBridge {
    use super::*;

    #[storage]
    struct Storage {
        shielded_pool: ContractAddress,
        governance: ContractAddress,
        supported_tokens: Map<ContractAddress, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TokenSupported: TokenSupported,
        TokenUnsupported: TokenUnsupported,
        WithdrawalProcessed: WithdrawalProcessed,
    }

    #[derive(Drop, starknet::Event)]
    struct TokenSupported {
        #[key]
        token: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct TokenUnsupported {
        #[key]
        token: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct WithdrawalProcessed {
        #[key]
        recipient: ContractAddress,
        #[key]
        token: ContractAddress,
        value: u256,
        nullifier: felt252,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, shielded_pool: ContractAddress, governance: ContractAddress,
    ) {
        self.shielded_pool.write(shielded_pool);
        self.governance.write(governance);
    }

    #[abi(embed_v0)]
    impl WithdrawBridgeImpl of IWithdrawBridge<ContractState> {
        fn withdraw(
            ref self: ContractState,
            token: ContractAddress,
            recipient: ContractAddress,
            value: u256,
            nullifier: felt252,
            proof: Array<felt252>,
            public_inputs: Array<felt252>,
        ) {
            let caller = get_caller_address();
            assert(value > 0, ERR_INVALID_VALUE);
            assert(self.supported_tokens.read(token), ERR_TOKEN_NOT_SUPPORTED);
            assert(recipient != Zeroable::zero(), 'invalid recipient');

            // Gọi shielded_pool.withdraw để verify proof, mark nullifier, và confirm spend
            let pool_dispatcher = IShieldedPoolDispatcher {
                contract_address: self.shielded_pool.read(),
            };
            pool_dispatcher.withdraw(proof, public_inputs, nullifier, recipient, value);

            // Sau khi shielded_pool xác nhận (không revert), bridge thực hiện transfer
            // token ra recipient
            let erc20 = IERC20Dispatcher { contract_address: token };
            erc20.transfer(recipient, value);

            self.emit(WithdrawalProcessed { recipient, token, value, nullifier });
        }

        fn add_supported_token(ref self: ContractState, token: ContractAddress) {
            assert(get_caller_address() == self.governance.read(), ERR_CALLER_NOT_AUTHORIZED);
            assert(token != Zeroable::zero(), 'invalid token address');

            self.supported_tokens.write(token, true);
            self.emit(TokenSupported { token });
        }

        fn remove_supported_token(ref self: ContractState, token: ContractAddress) {
            assert(get_caller_address() == self.governance.read(), ERR_CALLER_NOT_AUTHORIZED);
            self.supported_tokens.write(token, false);
            self.emit(TokenUnsupported { token });
        }

        fn is_supported_token(self: @ContractState, token: ContractAddress) -> bool {
            self.supported_tokens.read(token)
        }
    }
}
