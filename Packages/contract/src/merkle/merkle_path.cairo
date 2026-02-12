use array::ArrayTrait;
use utils::constants::TREE_HEIGHT;

#[derive(Copy, Drop, Serde, starknet::Store)]
struct MerklePath {
    siblings: Array<felt252>,
}

// 1. Define the trait first
trait MerklePathTrait<T> {
    fn new(siblings: Array<felt252>) -> T;
}

// 2. Implement it
impl MerklePathImpl of MerklePathTrait<MerklePath> {
    fn new(siblings: Array<felt252>) -> MerklePath {
        assert(siblings.len() == TREE_HEIGHT, 'invalid path length');
        MerklePath { siblings }
    }
}
