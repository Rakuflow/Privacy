use array::ArrayTrait;
use poseidon::PoseidonTrait;

type Nullifier = felt252;

fn compute_nullifier(note: Note, trapdoor: felt252) -> Nullifier {
    let mut inputs: Array<felt252> = ArrayTrait::new();
    inputs.append(note.rho);
    inputs.append(trapdoor);
    PoseidonTrait::new().update_with(inputs.span()).finalize()
}
