use core::array::ArrayTrait;
use core::option::OptionTrait;
use core::poseidon::poseidon_hash_span;
use core::traits::Into;
use crate::merkle_path::{MerklePath, MerklePathTrait};
use crate::utils_constants::{TREE_HEIGHT, ZERO_COMMITMENT};
use crate::utils_errors::TREE_FULL;

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

pub fn pow2_u256(exp: usize) -> u256 {
    let low = pow2_u128(exp);
    u256 { low, high: 0_u128 }
}

#[derive(Drop, Serde)]
pub struct IncrementalMerkleTree {
    pub root: felt252,
    pub frontiers: Array<felt252>,
    pub next_leaf_index: u256,
}

#[generate_trait]
pub impl IncrementalMerkleTreeImpl of IncrementalMerkleTreeTrait {
    fn new() -> IncrementalMerkleTree {
        let mut frontiers = ArrayTrait::<felt252>::new();
        let mut i: usize = 0;
        loop {
            if i == TREE_HEIGHT {
                break;
            }
            frontiers.append(ZERO_COMMITMENT);
            i += 1;
        }
        IncrementalMerkleTree { root: ZERO_COMMITMENT, frontiers, next_leaf_index: 0_u256 }
    }

    fn append_leaf(ref self: IncrementalMerkleTree, leaf: felt252) -> MerklePath {
        let max_leaves = pow2_u256(TREE_HEIGHT);
        assert(self.next_leaf_index < max_leaves, TREE_FULL);
        let mut current = leaf;
        let mut index = self.next_leaf_index;
        let mut path_siblings = ArrayTrait::<felt252>::new();
        let mut level: usize = 0;

        loop {
            if level == TREE_HEIGHT {
                break;
            }
            let sibling = *self.frontiers.at(level);
            path_siblings.append(sibling);

            let shift = pow2_u128(level);
            let is_right_u128 = (index.low / shift) % 2_u128;
            let is_right = is_right_u128.into();
            let mut hash_input = ArrayTrait::<felt252>::new();
            if is_right == 1 {
                hash_input.append(sibling);
                hash_input.append(current);
            } else {
                hash_input.append(current);
                hash_input.append(sibling);
            }
            current = poseidon_hash_span(hash_input.span());

            if level < TREE_HEIGHT - 1 {
                let mut new_frontiers = ArrayTrait::<felt252>::new();
                let mut j: usize = 0;
                loop {
                    if j == self.frontiers.len() {
                        break;
                    }
                    if j == level {
                        new_frontiers.append(current);
                    } else {
                        new_frontiers.append(*self.frontiers.at(j));
                    }
                    j += 1;
                }
                self.frontiers = new_frontiers;
            }
            level += 1;
        }

        self.root = current;
        self.next_leaf_index += 1_u256;

        let path = MerklePathTrait::new(path_siblings, index);
        path
    }

    fn get_root(self: @IncrementalMerkleTree) -> felt252 {
        *self.root
    }

    fn get_path_for_index(
        self: @IncrementalMerkleTree, index: u256, commitments: @Array<felt252>
    ) -> Option<MerklePath> {
        if *self.next_leaf_index <= index {
            return Option::None(());
        }
        let mut siblings = ArrayTrait::<felt252>::new();
        let mut current_level = 0_usize;
        let mut current_index = index;
        loop {
            if current_level == TREE_HEIGHT {
                break;
            }
            let shift = pow2_u128(current_level);
            let is_left_u128 = (current_index.low / shift) % 2_u128;
            let is_left = is_left_u128.into();
            let sibling = if is_left == 0 {
                let sibling_index = current_index + pow2_u256(current_level);
                if sibling_index >= *self.next_leaf_index {
                    ZERO_COMMITMENT
                } else if sibling_index.low < commitments.len().into() {
                    *commitments.at(sibling_index.low.try_into().unwrap())
                } else {
                    ZERO_COMMITMENT
                }
            } else {
                let sibling_index = current_index - pow2_u256(current_level);
                if sibling_index >= *self.next_leaf_index || sibling_index.low >= commitments.len().into() {
                    ZERO_COMMITMENT
                } else {
                    *commitments.at(sibling_index.low.try_into().unwrap())
                }
            };
            siblings.append(sibling);
            current_level += 1;
        }
        Option::Some(MerklePathTrait::new(siblings, index))
    }
}
