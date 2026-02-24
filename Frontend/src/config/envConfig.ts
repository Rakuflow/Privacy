function requireEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

export const env = {
  RPC_SEPOLIA: requireEnv('VITE_RPC_SEPOLIA'),
  RPC_MAINNET: requireEnv('VITE_RPC_MAINNET'),
  CHAIN_ID_SEPOLIA: requireEnv('VITE_CHAIN_ID_SEPOLIA'),
  CHAIN_ID_MAINNET: requireEnv('VITE_CHAIN_ID_MAINNET'),
  SHIELDED_POOL: requireEnv('VITE_SHIELDED_POOL'),
  GARAGA_VERIFIER: requireEnv('VITE_GARAGA_VERIFIER'),
  STRK_TOKEN: requireEnv('VITE_STRK_TOKEN'),
} as const;
