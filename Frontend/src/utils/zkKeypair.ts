import { hash, ec, typedData, Account, TypedData } from 'starknet';
import { CONTRACTS } from '../contracts/config';

/**
 * Generate typed data for user to sign
 * This signature will be used to derive the zk spending key
 */
export function getTypedDataForSigning(chainId: string): TypedData {
  return {
    domain: {
      name: 'Starknet Shielded Pool',
      version: '1',
      chainId,
    },
    types: {
      StarkNetDomain: [
        { name: 'name', type: 'felt' },
        { name: 'version', type: 'felt' },
        { name: 'chainId', type: 'felt' },
      ],
      Message: [{ name: 'purpose', type: 'felt' }],
    },
    primaryType: 'Message',
    message: {
      purpose: 'Generate shielded spending key',
    },
  };
}

/**
 * Derive zk spending key from signature
 *
 * Flow:
 * 1. entropy = Poseidon(signature.r, signature.s)
 * 2. zk_spend_sk = Poseidon(entropy, wallet_address, chain_id, contract_address)
 * 3. zk_spend_pk = Pedersen(zk_spend_sk)
 * 4. zk_address = Poseidon(zk_spend_pk)
 * 5. Convert 0x... → 0zk... format
 *
 * IMPORTANT: wallet_address is included in derivation to ensure different wallets
 *            produce different zk-addresses even with same signature
 */
export function deriveZkKeypair(signature: string[], chainId: string, walletAddress: string) {
  try {
    // Signature format: [r, s] (both as hex strings)
    const r = BigInt(signature[0]);
    const s = BigInt(signature[1]);

    // Step 1: entropy = Poseidon(r, s)
    const entropy = hash.computePoseidonHashOnElements([r.toString(), s.toString()]);

    // Step 2: zk_spend_sk = Poseidon(entropy, walletAddress, chainId, contractAddress)
    // Including walletAddress ensures uniqueness per wallet
    const contractAddress = CONTRACTS.SHIELDED_POOL;
    const zkSpendingSk = hash.computePoseidonHashOnElements([
      entropy,
      walletAddress, // ← CRITICAL: Ensures different wallets → different keys
      chainId,
      contractAddress,
    ]);

    // Step 3: zk_spend_pk = Pedersen(zk_spend_sk)
    const zkSpendingPk = hash.computePedersenHashOnElements([zkSpendingSk]);

    // Step 4: zk_address = Poseidon(zk_spend_pk)
    const zkAddressRaw = hash.computePoseidonHashOnElements([zkSpendingPk]);

    // Step 5: Convert 0x... → 0zk... format
    const zkAddress = '0zk' + zkAddressRaw.slice(2); // Remove "0x" and add "0zk"

    return {
      spendingKey: zkSpendingSk, // ONLY in memory!
      spendingPubKey: zkSpendingPk,
      zkAddress: zkAddress, // Format: 0zk...
    };
  } catch (error) {
    console.error('Error deriving zk-keypair:', error);
    throw new Error('Failed to derive zk-keypair from signature');
  }
}

/**
 * Generate random rho (nonce) for commitment
 */
export function generateRho(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const randomBigInt = BigInt(
    '0x' +
      Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
  );
  return hash.computePoseidonHashOnElements([randomBigInt.toString()]);
}

/**
 * Generate random rcm (blinding factor) for commitment
 */
export function generateRcm(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const randomBigInt = BigInt(
    '0x' +
      Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
  );
  return hash.computePoseidonHashOnElements([randomBigInt.toString()]);
}

/**
 * DEPRECATED - No longer storing keypair in localStorage
 * Keeping for migration purposes
 */
export function loadKeypair(address: string) {
  // Return null - keypair should be in memory only
  return null;
}

/**
 * DEPRECATED - No longer storing keypair in localStorage
 */
export function saveKeypair(address: string, keypair: any) {
  // Do nothing - we don't save spending keys anymore
  console.warn('saveKeypair is deprecated - spending keys are memory-only');
}
