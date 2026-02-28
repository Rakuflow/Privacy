use core::array::ArrayTrait;
use core::integer::u128;
use core::poseidon::poseidon_hash_span;
use core::traits::Into;
use crate::utils_constants::TREE_HEIGHT;
use crate::utils_errors::INVALID_PATH;

pub fn pow2_u128(exp: usize) -> u128 {
    let mut result: u128 = 1_u128;
    let mut i: usize = 0;
    loop {
        if i >= exp {
            break;
        }
        result *= 2_u128;
        i += 1;
    }
    result
}

#[derive(Drop, Serde)]
pub struct MerklePath {
    pub siblings: Array<felt252>,
    pub index: u256,
}

#[generate_trait]
pub impl MerklePathImpl of MerklePathTrait {
    fn new(siblings: Array<felt252>, index: u256) -> MerklePath {
        assert(siblings.len() == TREE_HEIGHT, INVALID_PATH);
        MerklePath { siblings, index }
    }

    fn verify(self: @MerklePath, leaf: felt252, expected_root: felt252) -> bool {
        let mut current = leaf;
        let mut idx = *self.index;
        let mut i: usize = 0;
        loop {
            if i >= TREE_HEIGHT {
                break;
            }
            let shift = pow2_u128(i);
            let bit_u128 = (idx.low / shift) % 2_u128;
            let bit = bit_u128.into();
            let sibling = *self.siblings.at(i);
            let mut hash_input = ArrayTrait::<felt252>::new();
            if bit == 1 {
                hash_input.append(sibling);
                hash_input.append(current);
            } else {
                hash_input.append(current);
                hash_input.append(sibling);
            }
            current = poseidon_hash_span(hash_input.span());
            i += 1;
        }
        current == expected_root
    }
}
