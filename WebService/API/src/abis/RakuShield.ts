export const RAKU_SHIELD_ABI = [
  {
    name: "shielded_transfer",
    type: "function",
    inputs: [
      { name: "proof", type: "core::array::Array::<core::felt252>" },
      { name: "public_inputs", type: "core::array::Array::<core::felt252>" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    name: "withdraw",
    type: "function",
    inputs: [
      { name: "proof", type: "core::array::Array::<core::felt252>" },
      { name: "public_inputs", type: "core::array::Array::<core::felt252>" },
      {
        name: "recipient",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [],
    state_mutability: "external",
  },
];
