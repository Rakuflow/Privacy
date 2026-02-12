use core::array::ArrayTrait;
use core::poseidon::poseidon_hash_span;
use crate::utils_constants::{MAX_VALUE, NULLIFIER_SEED, ZERO_VALUE};
use crate::utils_errors::{INSUFFICIENT_VALUE, INVALID_COMMITMENT};

#[derive(Copy, Drop, Serde)]
pub struct Note {
    pub value: u256,
    pub rho: felt252,
    pub rcm: felt252,
    pub spending_key: felt252,
}

#[generate_trait]
pub impl NoteImpl of NoteTrait {
    fn new(value: u256, rho: felt252, rcm: felt252, spending_key: felt252) -> Note {
        assert(value > ZERO_VALUE && value <= MAX_VALUE, INVALID_COMMITMENT);
        assert(rho != 0_felt252 && rcm != 0_felt252, INVALID_COMMITMENT);
        assert(spending_key != 0_felt252, INVALID_COMMITMENT);
        Note { value, rho, rcm, spending_key }
    }

    fn split(self: @Note, split_value: u256) -> (Note, Note) {
        assert(*self.value > split_value && split_value > ZERO_VALUE, INSUFFICIENT_VALUE);
        let remaining_value = *self.value - split_value;
        let mut rho_hasher = ArrayTrait::new();
        rho_hasher.append(*self.rho);
        rho_hasher.append(0_felt252);
        let rho_split = poseidon_hash_span(rho_hasher.span());
        let mut rho_remain_hasher = ArrayTrait::new();
        rho_remain_hasher.append(*self.rho);
        rho_remain_hasher.append(1_felt252);
        let rho_remain = poseidon_hash_span(rho_remain_hasher.span());

        let mut rcm_hasher = ArrayTrait::new();
        rcm_hasher.append(*self.rcm);
        rcm_hasher.append(0_felt252);
        let rcm_split = poseidon_hash_span(rcm_hasher.span());
        let mut rcm_remain_hasher = ArrayTrait::new();
        rcm_remain_hasher.append(*self.rcm);
        rcm_remain_hasher.append(1_felt252);
        let rcm_remain = poseidon_hash_span(rcm_remain_hasher.span());

        let note_split = NoteImpl::new(split_value, rho_split, rcm_split, *self.spending_key);
        let note_remain = NoteImpl::new(
            remaining_value, rho_remain, rcm_remain, *self.spending_key,
        );
        (note_split, note_remain)
    }

    fn commitment(self: @Note) -> felt252 {
        let mut input = ArrayTrait::<felt252>::new();
        input.append((*self.value).low.into());
        input.append((*self.value).high.into());
        input.append(*self.rho);
        input.append(*self.rcm);
        poseidon_hash_span(input.span())
    }

    fn nullifier(self: @Note, leaf_index: u256) -> felt252 {
        let mut input = ArrayTrait::<felt252>::new();
        input.append(*self.spending_key);
        input.append(NULLIFIER_SEED);
        input.append(leaf_index.low.into());
        poseidon_hash_span(input.span())
    }

    fn nullifier_hash(nullifier: felt252) -> felt252 {
        let mut input = ArrayTrait::<felt252>::new();
        input.append(nullifier);
        poseidon_hash_span(input.span())
    }
}
