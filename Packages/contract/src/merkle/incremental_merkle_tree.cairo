use array::{ArrayTrait, SpanTrait};
use poseidon::PoseidonTrait;
use utils::constants::{TREE_HEIGHT, ZERO_COMMITMENT};
use super::merkle_path::MerklePath;

#[derive(Copy, Drop, starknet::Store)]
struct IncrementalMerkleTree {
    root: felt252,
    frontiers: Array<felt252>,
    next_index: u256,
}

#[generate_trait]
impl IncrementalMerkleTreeImpl of IncrementalMerkleTreeTrait<IncrementalMerkleTree> {
    fn new(initial_root: felt252) -> IncrementalMerkleTree {
        let mut frontiers: Array<felt252> = ArrayTrait::new();
        let mut i: usize = 0;
        loop {
            if i >= TREE_HEIGHT - 1 {
                break;
            }
            frontiers.append(ZERO_COMMITMENT);
            i += 1;
        }

        IncrementalMerkleTree { root: initial_root, frontiers, next_index: 0_u256 }
    }

    fn append_leaf(ref self: IncrementalMerkleTree, leaf: felt252) -> u256 {
        let mut index = self.next_index;
        let mut current = leaf;
        let mut level: usize = 0;

        loop {
            if level >= TREE_HEIGHT {
                break;
            }

            let bit = (index.low
                / (1_u128 * pow2(level))) % 2_u128; 
            let side = bit == 1_u128;

            let sibling = *self.frontiers.at(level);

            if side {
                current = PoseidonTrait::new().update(sibling).update(current).finalize();
            } else {
                current = PoseidonTrait::new().update(current).update(sibling).finalize();
            }

            if level < TREE_HEIGHT - 1 {
                self.frontiers.replace(level, current);
            }

            level += 1;
        }

        self.root = current;
        self.next_index = self.next_index + 1_u256;

        index
    }

    fn verify_path(
        self: @IncrementalMerkleTree, path: MerklePath, leaf: felt252, leaf_index: u256,
    ) -> bool {
        let mut current = leaf;
        let mut index = leaf_index;
        let mut i: usize = 0;

        loop {
            if i >= TREE_HEIGHT {
                break;
            }

            let bit = (index.low / (1_u128 * pow2(i))) % 2_u128;
            let side = bit == 1_u128;

            let sibling = *path.siblings.at(i);

            if side {
                current = PoseidonTrait::new().update(sibling).update(current).finalize();
            } else {
                current = PoseidonTrait::new().update(current).update(sibling).finalize();
            }

            i += 1;
        }

        current == *self.root
    }
}

// Helper function
fn pow2(exp: usize) -> u128 {
    let mut result: u128 = 1;
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
