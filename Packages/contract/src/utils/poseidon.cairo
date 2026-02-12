// Override if needed, else use std::poseidon
use array::SpanTrait;
use poseidon::PoseidonTrait;

// Example wrapper if custom
fn poseidon_hash_many(inputs: Span<felt252>) -> felt252 {
    PoseidonTrait::new().update_with(inputs).finalize()
}
