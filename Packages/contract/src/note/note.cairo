use poseidon::PoseidonTrait;
use starknet::ContractAddress;
use utils::poseidon::poseidon_hash_many;

#[derive(Copy, Drop, Serde, starknet::Store)]
struct Note {
    rho: felt252, // randomness
    value: u256,
    rcm: felt252, // commitment randomness
    owner_pk: felt252 // zk-address derived from signature
}

#[generate_trait]
impl NoteImpl of NoteTrait<Note> {
    fn new(rho: felt252, value: u256, rcm: felt252, owner_pk: felt252) -> Note {
        Note { rho, value, rcm, owner_pk }
    }

    fn check_ownership(self: @Note, provided_pk: felt252) -> bool {
        *self.owner_pk == provided_pk
    }
}
