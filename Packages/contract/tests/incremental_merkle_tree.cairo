#[cfg(test)]
mod tests {
    use contract::incremental_merkle_tree::{IncrementalMerkleTreeTrait, pow2_u256};
    use contract::utils_constants::{TREE_HEIGHT, ZERO_COMMITMENT};
    use core::array::ArrayTrait;
    use core::option::OptionTrait;

    #[test]
    fn test_merkle_tree_new() {
        let tree = IncrementalMerkleTreeTrait::new();
        assert(tree.root == ZERO_COMMITMENT, 'Root should be zero');
        assert(tree.frontiers.len() == TREE_HEIGHT, 'Frontiers wrong length');
        assert(tree.next_leaf_index == 0_u256, 'Next index should be 0');
    }

    #[test]
    fn test_merkle_tree_append_leaf() {
        let mut tree = IncrementalMerkleTreeTrait::new();
        let leaf1 = 123_felt252;
        let path1 = tree.append_leaf(leaf1);
        assert(tree.root != ZERO_COMMITMENT, 'Root should update');
        assert(tree.next_leaf_index == 1_u256, 'Next index should be 1');
        assert(path1.siblings.len() == TREE_HEIGHT, 'Path siblings wrong length');

        let leaf2 = 456_felt252;
        let _ = tree.append_leaf(leaf2);
        assert(tree.next_leaf_index == 2_u256, 'Next index should be 2');
    }

    #[test]
    #[should_panic(expected: ('TREE_FULL', ))]
    fn test_merkle_tree_full() {
        let mut tree = IncrementalMerkleTreeTrait::new();
        let max_leaves = pow2_u256(TREE_HEIGHT);
        let mut i: u256 = 0_u256;
        loop {
            if i == max_leaves {
                break;
            }
            tree.append_leaf(1_felt252);
            i += 1_u256;
        };
        tree.append_leaf(1_felt252);
    }

    #[test]
    fn test_merkle_tree_get_path_for_index() {
        let mut tree = IncrementalMerkleTreeTrait::new();
        tree.append_leaf(123_felt252);
        tree.append_leaf(456_felt252);

        let option_path = tree.get_path_for_index(0_u256);
        match option_path {
            Option::Some(path) => {
                assert(path.siblings.len() == TREE_HEIGHT, 'Path wrong length');
            },
            Option::None => assert(false, 'Path should not exist'),
        };

        let invalid_option = tree.get_path_for_index(10_u256);
        match invalid_option {
            Option::Some(_) => assert(false, 'Path should not exist'),
            Option::None => {},
        };
    }
}