import { env } from '../config/envConfig';

// Wallet URLs
export const WALLET_URLS = {
  ARGENT_X: 'https://www.ready.co/',
  BRAAVOS: 'https://braavos.app/',
  ARGENT_EXTENSION: 'https://chromewebstore.google.com/detail/ready-wallet-formerly-arg/dlcobpjiigpikoobohmabehhmhfoodbb',
  BRAAVOS_EXTENSION: 'https://chromewebstore.google.com/detail/braavos-bitcoin-starknet/jnlgamecbpmbajjfhmmmlhejkemejdma',
} as const;

// Explorer URLs
export const EXPLORER_URLS = {
  SEPOLIA: 'https://sepolia.voyager.online/',
  MAINNET: 'https://voyager.online/',
} as const;

// RPC URLs
export const RPC_URLS = {
  SEPOLIA: 'https://starknet-sepolia.public.blastapi.io',
};

export const OTHER_URLS = {
  GITHUB: 'https://github.com/Rakuflow/Privacy',
  DOCUMENTATION: 'https://docs.starknet.io',
};

// API Endpoints
export const API_ENDPOINTS = {
  BASE_URL: env.RELAYER_URL,
};
