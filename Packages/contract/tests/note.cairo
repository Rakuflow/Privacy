#[cfg(test)]
mod tests {
    use contract::note::NoteTrait;
    use core::array::ArrayTrait;

    #[test]
    fn test_note_new() {
        let value = 100_u256;
        let rho = 1_felt252;
        let rcm = 2_felt252;
        let spending_key = 3_felt252;
        let note = NoteTrait::new(value, rho, rcm, spending_key);
        assert(note.value == value, 'Value mismatch');
    }

    #[test]
    #[should_panic(expected: ('INVALID_COMMITMENT', ))]
    fn test_note_new_invalid_value() {
        NoteTrait::new(0_u256, 1_felt252, 2_felt252, 3_felt252);
    }

    #[test]
    #[should_panic(expected: ('INSUFFICIENT_VALUE', ))]
    fn test_note_split_invalid() {
        let note = NoteTrait::new(100_u256, 1_felt252, 2_felt252, 3_felt252);
        let _ = note.split(200_u256);
    }

    #[test]
    fn test_note_split() {
        let note = NoteTrait::new(100_u256, 1_felt252, 2_felt252, 3_felt252);
        let (split, remain) = note.split(40_u256);
        assert(split.value == 40_u256, 'Split value wrong');
        assert(remain.value == 60_u256, 'Remain value wrong');
    }

    #[test]
    fn test_note_commitment_and_nullifier() {
        let note = NoteTrait::new(100_u256, 1_felt252, 2_felt252, 3_felt252);
        let commitment = note.commitment();
        assert(commitment != 0_felt252, 'Commitment should not be zero');

        let nullifier = note.nullifier(0_u256);
        assert(nullifier != 0_felt252, 'Nullifier should not be zero');

        let nullifier_hash = NoteTrait::nullifier_hash(nullifier);
        assert(nullifier_hash != nullifier, 'Hash should differ');
    }
}