use std::hash::pedersen_hash;

// NOTE:
// - Public inputs are aligned with contract withdraw flow:
//   [root, nullifier_hash, amount_low, amount_high, recipient]
fn hash2(left: Field, right: Field) -> Field {
    pedersen_hash([left, right])
}

fn hash_note(
    amount_low: Field,
    amount_high: Field,
    rho: Field,
    rcm: Field,
    spending_key: Field,
) -> Field {
    let amount_hash = hash2(amount_low, amount_high);
    let blinding_hash = hash2(rho, rcm);
    hash2(hash2(amount_hash, blinding_hash), spending_key)
}

fn hash_nullifier(spending_key: Field, rho: Field, leaf_index: Field) -> Field {
    let base = hash2(spending_key, rho);
    hash2(base, leaf_index)
}

fn compute_root(
    leaf: Field,
    siblings: [Field; 20],
    directions: [Field; 20],
) -> Field {
    let mut current = leaf;
    for i in 0..20 {
        let bit = directions[i];
        // Constrain direction bit to {0,1}.
        assert(bit * (bit - 1) == 0);

        let sibling = siblings[i];
        if bit == 0 {
            current = hash2(current, sibling);
        } else {
            current = hash2(sibling, current);
        }
    }
    current
}

fn main(
    // Private witness
    amount_low: Field,
    amount_high: Field,
    rho: Field,
    rcm: Field,
    spending_key: Field,
    leaf_index: Field,
    merkle_siblings: [Field; 20],
    merkle_directions: [Field; 20],
    // Public inputs
    root: pub Field,
    nullifier_hash: pub Field,
    amount_low_public: pub Field,
    amount_high_public: pub Field,
    recipient: pub Field,
) {
    assert(spending_key != 0);
    assert(recipient != 0);
    assert(amount_low + amount_high != 0);

    let note_commitment = hash_note(amount_low, amount_high, rho, rcm, spending_key);
    let computed_root = compute_root(note_commitment, merkle_siblings, merkle_directions);
    assert(computed_root == root);

    let computed_nullifier = hash_nullifier(spending_key, rho, leaf_index);
    assert(computed_nullifier == nullifier_hash);

    assert(amount_low == amount_low_public);
    assert(amount_high == amount_high_public);
}
