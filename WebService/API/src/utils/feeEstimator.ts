/**
 * Fee Estimation & Payment Collection
 * Estimates gas fees and handles fee payments from users
 */

import { Account, RpcProvider, CallData, Contract, num } from 'starknet';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';
import { FeeQuote } from '../types.js';

export const TOKEN_ADDRESSES = {
  STRK: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  ETH: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  USDC: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
};

const SERVICE_FEE_PERCENTAGE = 15;
const feeQuotes = new Map<string, FeeQuote>();
const QUOTE_EXPIRATION_MS = 2 * 60 * 1000;

export async function estimateGasFee(
  provider: RpcProvider,
  relayerAccount: Account,
  contractAddress: string,
  functionName: string,
  calldata: any[],
): Promise<bigint> {
  void provider;

  try {
    const call = {
      contractAddress,
      entrypoint: functionName,
      calldata: CallData.compile(calldata),
    };

    const nonce = await relayerAccount.getNonce('latest');
    const feeEstimate = await relayerAccount.estimateInvokeFee([call], {
      nonce,
      blockIdentifier: 'latest',
    });

    const overallFee = feeEstimate.overall_fee;
    const feeWithBuffer = (BigInt(overallFee) * 120n) / 100n;

    return feeWithBuffer;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('Contract not found')) {
      logger.warn(
        {
          functionName,
          contractAddress,
        },
        'Relayer account is not deployed on this network. Falling back to default fee estimate.',
      );
      return BigInt('1000000000000000');
    }

    if (message.includes('Cannot convert undefined to a BigInt')) {
      logger.warn(
        {
          functionName,
          contractAddress,
        },
        'RPC fee-estimate response format incompatible with parser. Falling back to default fee estimate.',
      );
      return BigInt('1000000000000000');
    }

    logger.error(
      {
        functionName,
        contractAddress,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      },
      'Gas estimation error',
    );

    return BigInt('1000000000000000');
  }
}

export function calculateServiceFee(gasFee: bigint): bigint {
  return (gasFee * BigInt(SERVICE_FEE_PERCENTAGE)) / 100n;
}

export async function getExchangeRate(
  fromToken: 'STRK' | 'ETH' | 'USDC',
  toToken: 'STRK',
): Promise<number> {
  const rates: Record<string, number> = {
    'STRK->STRK': 1,
    'ETH->STRK': 1000,
    'USDC->STRK': 0.5,
  };

  const key = `${fromToken}->${toToken}`;
  return rates[key] || 1;
}

export async function convertFee(
  amountInStrk: bigint,
  toToken: 'STRK' | 'ETH' | 'USDC',
): Promise<bigint> {
  if (toToken === 'STRK') {
    return amountInStrk;
  }

  const rate = await getExchangeRate(toToken, 'STRK');
  const rateScaled = BigInt(Math.floor(rate * 1e18));
  const converted = (amountInStrk * BigInt(1e18)) / rateScaled;

  return converted;
}

export async function createFeeQuote(
  estimatedGasFee: bigint,
  feeToken: 'STRK' | 'ETH' | 'USDC',
): Promise<FeeQuote> {
  const serviceFee = calculateServiceFee(estimatedGasFee);
  const totalFeeInStrk = estimatedGasFee + serviceFee;
  const totalFeeInRequestedToken = await convertFee(totalFeeInStrk, feeToken);

  const quoteId = uuidv4();
  const now = Date.now();

  const quote: FeeQuote = {
    quoteId,
    totalFee: totalFeeInRequestedToken.toString(),
    feeToken,
    estimatedGasFee: estimatedGasFee.toString(),
    createdAt: now,
    expiresAt: now + QUOTE_EXPIRATION_MS,
  };

  feeQuotes.set(quoteId, quote);
  cleanupExpiredQuotes();

  return quote;
}

export function verifyFeeQuote(quoteId: string): FeeQuote | null {
  const quote = feeQuotes.get(quoteId);

  if (!quote) {
    return null;
  }

  if (Date.now() > quote.expiresAt) {
    feeQuotes.delete(quoteId);
    return null;
  }

  return quote;
}

function cleanupExpiredQuotes() {
  const now = Date.now();
  for (const [quoteId, quote] of feeQuotes.entries()) {
    if (now > quote.expiresAt) {
      feeQuotes.delete(quoteId);
    }
  }
}

export async function collectFeeFromUser(
  provider: RpcProvider,
  userAddress: string,
  relayerAddress: string,
  feeToken: 'STRK' | 'ETH' | 'USDC',
  amount: bigint,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  void provider;

  try {
    const tokenAddress = TOKEN_ADDRESSES[feeToken];

    logger.info(
      {
        feeToken,
        amountHex: num.toHex(amount),
        userAddress,
        relayerAddress,
        tokenAddress,
        mode: 'mock',
      },
      'Collecting fee from user',
    );

    return {
      success: true,
      txHash: '0xmock_payment_tx_' + Date.now().toString(16),
    };

    /*
    const erc20Abi = [
      {
        name: 'transferFrom',
        type: 'function',
        inputs: [
          { name: 'sender', type: 'core::starknet::contract_address::ContractAddress' },
          { name: 'recipient', type: 'core::starknet::contract_address::ContractAddress' },
          { name: 'amount', type: 'core::integer::u256' },
        ],
        outputs: [{ type: 'core::bool' }],
        state_mutability: 'external',
      },
    ];

    const erc20Contract = new Contract(erc20Abi, tokenAddress, provider);
    erc20Contract.connect(relayerAccount);

    const transferCall = erc20Contract.populate('transferFrom', [
      userAddress,
      relayerAddress,
      { low: amount & 0xFFFFFFFFFFFFFFFFn, high: amount >> 128n },
    ]);

    const result = await relayerAccount.execute(transferCall);
    await provider.waitForTransaction(result.transaction_hash);

    return {
      success: true,
      txHash: result.transaction_hash,
    };
    */
  } catch (error) {
    logger.error(
      {
        userAddress,
        relayerAddress,
        feeToken,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      },
      'Fee collection error',
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown payment error',
    };
  }
}
