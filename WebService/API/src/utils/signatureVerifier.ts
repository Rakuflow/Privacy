/**
 * Signature Verification Utilities
 * Verifies user signatures on relay intents
 */

import { hash, encode, typedData } from 'starknet';
import { logger } from '../config/logger.js';
import { RelayIntent, SignatureVerificationResult } from '../types.js';

export function getRelayIntentTypedData(intent: Omit<RelayIntent, 'signature'>) {
  return {
    types: {
      StarkNetDomain: [
        { name: 'name', type: 'felt' },
        { name: 'version', type: 'felt' },
        { name: 'chainId', type: 'felt' },
      ],
      RelayIntent: [
        { name: 'type', type: 'felt' },
        { name: 'userAddress', type: 'felt' },
        { name: 'timestamp', type: 'felt' },
        { name: 'nonce', type: 'felt' },
        { name: 'feeToken', type: 'felt' },
        { name: 'maxFeeAmount', type: 'felt' },
        { name: 'proofHash', type: 'felt' },
        { name: 'publicInputsHash', type: 'felt' },
      ],
    },
    primaryType: 'RelayIntent',
    domain: {
      name: 'Starknet Shielded Pool Relayer',
      version: '1',
      chainId: encode.addHexPrefix(encode.buf2hex(encode.utf8ToArray('SN_SEPOLIA'))),
    },
    message: {
      type: intent.type === 'transfer' ? '0x1' : '0x2',
      userAddress: intent.userAddress,
      timestamp: '0x' + intent.timestamp.toString(16),
      nonce: intent.nonce,
      feeToken: getTokenFelt(intent.feeToken),
      maxFeeAmount: intent.maxFeeAmount,
      proofHash: hash.computePoseidonHashOnElements(intent.proof),
      publicInputsHash: hash.computePoseidonHashOnElements(intent.publicInputs),
    },
  };
}

function getTokenFelt(token: 'STRK' | 'ETH' | 'USDC'): string {
  const tokenMap: Record<string, string> = {
    STRK: '0x1',
    ETH: '0x2',
    USDC: '0x3',
  };
  return tokenMap[token] || '0x1';
}

export function verifyRelayIntentSignature(
  intent: RelayIntent,
): SignatureVerificationResult {
  try {
    const { signature, ...intentData } = intent;
    const normalizedSignature = normalizeSignature(signature);

    if (!normalizedSignature) {
      return {
        valid: false,
        error: 'Invalid signature format (expected [r, s] or object with r/s)',
      };
    }

    const [r, s] = normalizedSignature;

    const typedDataMessage = getRelayIntentTypedData(intentData);
    typedData.getMessageHash(typedDataMessage, intent.userAddress);

    if (!r.startsWith('0x') || !s.startsWith('0x')) {
      return {
        valid: false,
        error: 'Signature components must be hex strings',
      };
    }

    const now = Date.now();
    const intentAge = now - intent.timestamp;
    const MAX_INTENT_AGE = 5 * 60 * 1000;

    if (intentAge > MAX_INTENT_AGE) {
      return {
        valid: false,
        error: `Intent expired (age: ${Math.floor(intentAge / 1000)}s, max: ${MAX_INTENT_AGE / 1000}s)`,
      };
    }

    if (intent.timestamp > now + 60000) {
      return {
        valid: false,
        error: 'Intent timestamp is in the future',
      };
    }

    return {
      valid: true,
      recoveredAddress: intent.userAddress,
    };
  } catch (error) {
    logger.error(
      {
        userAddress: intent.userAddress,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      },
      'Signature verification error',
    );

    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

function normalizeSignature(signature: unknown): [string, string] | null {
  if (Array.isArray(signature) && signature.length >= 2) {
    const r = toHexFelt(signature[0]);
    const s = toHexFelt(signature[1]);
    if (!r || !s) return null;
    return [r, s];
  }

  if (
    signature &&
    typeof signature === 'object' &&
    'r' in signature &&
    's' in signature
  ) {
    const sig = signature as { r: unknown; s: unknown };
    const r = toHexFelt(sig.r);
    const s = toHexFelt(sig.s);
    if (!r || !s) return null;
    return [r, s];
  }

  return null;
}

function toHexFelt(value: unknown): string | null {
  try {
    if (typeof value === 'string') {
      const v = value.trim();
      if (!v) return null;
      if (v.startsWith('0x')) return v.toLowerCase();
      if (/^\d+$/.test(v)) return `0x${BigInt(v).toString(16)}`;
      return null;
    }

    if (typeof value === 'bigint') {
      return `0x${value.toString(16)}`;
    }

    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return `0x${BigInt(value).toString(16)}`;
    }

    return null;
  } catch {
    return null;
  }
}

const usedNonces = new Set<string>();

export function validateNonce(nonce: string, userAddress: string): boolean {
  const key = `${userAddress}:${nonce}`;

  if (usedNonces.has(key)) {
    return false;
  }

  usedNonces.add(key);

  if (usedNonces.size > 1000) {
    const toDelete = Array.from(usedNonces).slice(0, 100);
    toDelete.forEach((n) => usedNonces.delete(n));
  }

  return true;
}
