import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './logger.js';

dotenv.config();

const configDir = dirname(fileURLToPath(import.meta.url));
const defaultConfig = JSON.parse(
  readFileSync(join(configDir, 'default.json'), 'utf-8'),
);
const relayerCairoVersion =
  process.env.RELAYER_CAIRO_VERSION === '0' ||
  process.env.RELAYER_CAIRO_VERSION === '1'
    ? process.env.RELAYER_CAIRO_VERSION
    : '1';
const relayerTxMaxFeeWei =
  process.env.RELAYER_TX_MAX_FEE_WEI || '100000000000000000';
const rawRpcUrl = process.env.RPC_URL || defaultConfig.RPC_URL;
const rpcUrl = rawRpcUrl;

export const config = {
  PORT: process.env.PORT || defaultConfig.PORT,

  RPC_URL: rpcUrl,
  RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY!,
  RELAYER_ADDRESS: process.env.RELAYER_ADDRESS!,
  RELAYER_CAIRO_VERSION: relayerCairoVersion,
  RELAYER_TX_MAX_FEE_WEI: relayerTxMaxFeeWei,
  SHIELDED_POOL_CONTRACT: process.env.SHIELDED_POOL_CONTRACT!,

  STRK_ADDRESS: defaultConfig.STRK_ADDRESS,

  MONGO_URI: process.env.MONGO_URI!,
  MONGO_DB_NAME: process.env.MONGO_DB_NAME || 'test_net',

  RATE_LIMIT_WINDOW_MS: defaultConfig.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: defaultConfig.RATE_LIMIT_MAX,

  FEE_SERVICE_PERCENTAGE: defaultConfig.FEE_SERVICE_PERCENTAGE,
  FEE_QUOTE_EXPIRY_MS: defaultConfig.FEE_QUOTE_EXPIRY_MS,
};

export function validateConfig() {
  const required = [
    'RELAYER_PRIVATE_KEY',
    'RELAYER_ADDRESS',
    'SHIELDED_POOL_CONTRACT',
    'MONGO_URI',
  ];

  const missing = required.filter((key) => !config[key as keyof typeof config]);

  if (missing.length > 0) {
    logger.error(
      {
        missing,
      },
      'Missing required environment variables',
    );
    process.exit(1);
  }
}
