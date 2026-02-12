use array::ArrayTrait;
use array::SpanTrait;
use poseidon::PoseidonTrait;
use utils::constants::{TREE_HEIGHT, ZERO_COMMITMENT};
use super::merkle_path::MerklePath;

#[derive(Copy, Drop, starknet::Store)]
struct IncrementalMerkleTree {
    root: felt252,
    frontiers: Array<felt252>,  // One per level, up to TREE_HEIGHT - 1
    next_index: u256,
}

#[generate_trait]
impl IncrementalMerkleTreeImpl of IncrementalMerkleTreeTrait {
    fn new(initial_root: felt252) -> IncrementalMerkleTree {
        let mut frontiers = ArrayTrait::new();
        let mut i: usize = 0;
        while i < TREE_HEIGHT - 1 {
            frontiers.append(ZERO_COMMITMENT);
            i += 1;
        };
        IncrementalMerkleTree { root: initial_root, frontiers, next_index: 0 }
    }

    fn append_leaf(ref self: IncrementalMerkleTree, leaf: felt252) -> u256 {
        let index = self.next_index;
        let mut current = leaf;
        let mut level: usize = 0;
        let mut side: bool;

        while level < TREE_HEIGHT {
            side = ((index >> level) & 1) == 1;
            let sibling = self.frontiers.at(level);
            if side {
                current = poseidon_hash(*sibling, current);
            } else {
                current = poseidon_hash(current, *sibling);
            }

            if level < TREE_HEIGHT - 1 {
                self.frontiers[level] = current;
            }

            level += 1;
        };

        self.root = current;
        self.next_index += 1;
        index
    }

    fn get_root(self: @IncrementalMerkleTree) -> felt252 {
        *self.root
    }

    fn verify_path(
        self: @IncrementalMerkleTree, path: MerklePath, leaf: felt252, leaf_index: u256
    ) -> bool {
        let mut current = leaf;
        let mut index = leaf_index;
        let mut i: usize = 0;
        while i < TREE_HEIGHT {
            let sibling = path.siblings.at(i);
            let side = ((index >> i) & 1) == 1;
            if side {
                current = poseidon_hash(*sibling, current);
            } else {
                current = poseidon_hash(current, *sibling);
            }
            i += 1;
        };
        current == *self.root
    }
}

fn poseidon_hash(a: felt252, b: felt252) -> felt252 {
    let mut inputs: Array<felt252> = ArrayTrait::new();
    inputs.append(a);
    inputs.append(b);
    PoseidonTrait::new().update_with(inputs.span()).finalize()
}