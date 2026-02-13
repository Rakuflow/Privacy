#[cfg(test)]
mod tests {
    use snforge_std::{declare, deploy_syscall, cheat_caller_address_global, ContractClassTrait};
    use starknet::{ContractAddress, contract_address_const};
    use core::traits::{Into, TryInto};
    use core::option::OptionTrait;
    use core::result::ResultTrait;
    use core::array::{ArrayTrait, SpanTrait};
    use contract::incremental_merkle_tree::{IncrementalMerkleTree, IncrementalMerkleTreeTrait};
    use contract::merkle_path::{MerklePath, MerklePathTrait};
    use contract::note::{Note, NoteTrait};
    use contract::shielded_pool_interface::{IShieldedPoolDispatcher, IShieldedPoolDispatcherTrait};
    use contract::verifier_interface::{IVerifierDispatcher, IVerifierDispatcherTrait};
    use contract::utils_constants::{TREE_HEIGHT, ZERO_COMMITMENT, ZERO_VALUE, MAX_VALUE, NULLIFIER_SEED, NULLIFIER_HASH_SEED};
    use contract::utils_errors::*;
    use contract::incremental_merkle_tree::{pow2_u128, pow2_u256}; 

    #[test]
    fn test_merkle_path_new() {
        let mut siblings = ArrayTrait::<felt252>::new();
        let mut i: usize = 0;
        loop {
            if i == TREE_HEIGHT {
                break;
            }
            siblings.append(ZERO_COMMITMENT);
            i += 1;
        };
        let path = MerklePathTrait::new(siblings, 0_u256);
        assert(path.siblings.len() == TREE_HEIGHT, 'Siblings wrong length');
    }

    #[test]
    #[should_panic(expected: ('INVALID_PATH', ))]
    fn test_merkle_path_new_invalid_length() {
        let mut siblings = ArrayTrait::<felt252>::new();
        siblings.append(1_felt252); // Wrong length
        let _ = MerklePathTrait::new(siblings, 0_u256);
    }

    #[test]
    fn test_merkle_path_verify() {
        let mut tree = IncrementalMerkleTreeTrait::new();
        let leaf = 123_felt252;
        let path = tree.append_leaf(leaf);
        let root = tree.get_root();

        let is_valid = path.verify(leaf, root);
        assert(is_valid, 'Path should verify');

        let invalid_is_valid = path.verify(999_felt252, root); // Wrong leaf
        assert(!invalid_is_valid, 'Invalid leaf should fail');
    }
}