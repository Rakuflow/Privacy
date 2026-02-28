import { env } from '../config/envConfig';

export const CONTRACTS = {
  SHIELDED_POOL: env.SHIELDED_POOL,
  GARAGA_VERIFIER: env.GARAGA_VERIFIER,
  STRK_TOKEN: env.STRK_TOKEN,
} as const;

export const NETWORK = {
  CHAIN_ID: env.CHAIN_ID_SEPOLIA, // SN_SEPOLIA
  RPC_URL: env.RPC_SEPOLIA,
} as const;

export const TOKENS = {
  STRK: {
    address: CONTRACTS.STRK_TOKEN,
    symbol: 'STRK',
    name: 'Starknet Token',
    decimals: 18,
  },
} as const;
