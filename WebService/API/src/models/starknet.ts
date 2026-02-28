import {
  RpcProvider,
  Account,
  ETransactionVersion,
  type CairoVersion,
} from 'starknet';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

export const provider = new RpcProvider({
  nodeUrl: config.RPC_URL,
});

export const relayerAccount = new Account({
  provider,
  address: config.RELAYER_ADDRESS,
  signer: config.RELAYER_PRIVATE_KEY,
  cairoVersion: config.RELAYER_CAIRO_VERSION as CairoVersion,
  transactionVersion: ETransactionVersion.V3,
});

export async function isRelayerDeployedLatest(): Promise<boolean> {
  try {
    await provider.getClassHashAt(config.RELAYER_ADDRESS, 'latest');
    return true;
  } catch (error: any) {
    const message = error?.message || '';
    if (message.includes('Contract not found')) {
      return false;
    }
    throw error;
  }
}

export async function getRelayerNonceLatest(): Promise<string> {
  try {
    return await relayerAccount.getNonce('latest');
  } catch (error: any) {
    const message = error?.message || '';
    if (message.includes('Contract not found')) {
      throw new Error(
        'Relayer account is not deployed on this network. Check RELAYER_ADDRESS/RELAYER_PRIVATE_KEY and deploy the account first.',
      );
    }
    throw error;
  }
}

export async function getRelayerBalance(): Promise<bigint> {
  try {
    const STRK_TOKEN = config.STRK_ADDRESS;

    const result = await provider.callContract(
      {
        contractAddress: STRK_TOKEN,
        entrypoint: 'balanceOf',
        calldata: [config.RELAYER_ADDRESS],
      },
      'latest',
    );

    const low = BigInt(result[0] || '0');
    const high = BigInt(result[1] || '0');
    return low + (high << 128n);
  } catch (error) {
    logger.error(
      {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      },
      'Error getting relayer balance',
    );

    return 0n;
  }
}
