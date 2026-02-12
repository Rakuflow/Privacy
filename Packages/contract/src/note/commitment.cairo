use array::ArrayTrait;
use poseidon::PoseidonTrait;
use traits::Into;

type Commitment = felt252;

fn compute_commitment(note: Note) -> Commitment {
    let mut inputs: Array<felt252> = ArrayTrait::new();
    inputs.append(note.rho);
    inputs.append(note.value.low.into());
    inputs.append(note.value.high.into());
    inputs.append(note.rcm);
    inputs.append(note.owner_pk);
    PoseidonTrait::new().update_with(inputs.span()).finalize()
}
