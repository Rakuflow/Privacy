export const CONTRACTS = {
  SHIELDED_POOL: "0x071f8904e5bbf7c628b33c6d522ae61e2febcba3594587a35d251b9738efe864",
  GARAGA_VERIFIER: "0x0449c9a4305ef66a6ee55b5ae57a75fde828e414f1d553c6f1d7676da36ea846",
  STRK_TOKEN: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
} as const;

export const NETWORK = {
  CHAIN_ID: "0x534e5f5345504f4c4941", // SN_SEPOLIA
  RPC_URL: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/TKkf7WGt-7f8NztYfKlzMFU8pN7i5Gfr",
} as const;

export const TOKENS = {
  STRK: {
    address: CONTRACTS.STRK_TOKEN,
    symbol: "STRK",
    name: "Starknet Token",
    decimals: 18,
  },
} as const;