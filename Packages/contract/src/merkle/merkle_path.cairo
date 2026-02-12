use array::ArrayTrait;
use utils::constants::TREE_HEIGHT;

#[derive(Copy, Drop, Serde, starknet::Store)]
struct MerklePath {
    siblings: Array<felt252>,  // TREE_HEIGHT siblings
}

impl MerklePathImpl {
    fn new(siblings: Array<felt252>) -> MerklePath {
        assert(siblings.len() == TREE_HEIGHT, 'invalid path length');
        MerklePath { siblings }
    }
}