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
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    );
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256);
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
}

#[starknet::interface]
trait IDepositBridge<TContractState> {
    fn deposit(
        ref self: TContractState,
        token: ContractAddress,
        value: u256,
        commitment: felt252,
        proof: Array<felt252>,
        public_inputs: Array<felt252>,
    );

    fn add_supported_token(ref self: TContractState, token: ContractAddress);
    fn remove_supported_token(ref self: TContractState, token: ContractAddress);
    fn is_supported_token(self: @TContractState, token: ContractAddress) -> bool;
}

#[starknet::contract]
mod DepositBridge {
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
        DepositProcessed: DepositProcessed,
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
    struct DepositProcessed {
        #[key]
        caller: ContractAddress,
        #[key]
        token: ContractAddress,
        value: u256,
        commitment: felt252,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, shielded_pool: ContractAddress, governance: ContractAddress,
    ) {
        self.shielded_pool.write(shielded_pool);
        self.governance.write(governance);
    }

    #[abi(embed_v0)]
    impl DepositBridgeImpl of IDepositBridge<ContractState> {
        fn deposit(
            ref self: ContractState,
            token: ContractAddress,
            value: u256,
            commitment: felt252,
            proof: Array<felt252>,
            public_inputs: Array<felt252>,
        ) {
            let caller = get_caller_address();
            assert(value > 0, ERR_INVALID_VALUE);
            assert(self.supported_tokens.read(token), ERR_TOKEN_NOT_SUPPORTED);

            // Transfer token từ caller → shielded_pool contract
            let erc20 = IERC20Dispatcher { contract_address: token };
            erc20.transfer_from(caller, self.shielded_pool.read(), value);

            // Gọi shielded_pool.deposit để verify proof và append commitment
            let pool_dispatcher = IShieldedPoolDispatcher {
                contract_address: self.shielded_pool.read(),
            };
            pool_dispatcher.deposit(proof, public_inputs, commitment, value);

            self.emit(DepositProcessed { caller, token, value, commitment });
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
