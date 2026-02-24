interface ImportMetaEnv {
  readonly VITE_RPC_SEPOLIA: string;
  readonly VITE_RPC_MAINNET: string;
  readonly VITE_CHAIN_ID_SEPOLIA: string;
  readonly VITE_CHAIN_ID_MAINNET: string;
  readonly VITE_SHIELDED_POOL: string;
  readonly VITE_GARAGA_VERIFIER: string;
  readonly VITE_STRK_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
