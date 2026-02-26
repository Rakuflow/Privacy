/**
 * ZK Proof Generator for Withdrawal
 *
 * NOTE: This works with a mock verifier that only checks proof/public_inputs length.
 * In production with real Garaga verifier, this would generate actual ZK proofs.
 */

import { hash } from 'starknet';
import type { ShieldedNote } from '../types/NoteStorage.type';
import type { WithdrawalProof } from '../types/Proof.type';

/**
 * Compute nullifier hash for a note
 * nullifier = Poseidon(spendingKey, rho, leafIndex)
 *
 * This ensures:
 * 1. Only owner can compute nullifier (has spendingKey)
 * 2. Each note has unique nullifier (different rho/leafIndex)
 * 3. Contract can check if nullifier already used (prevent double-spend)
 */
export function computeNullifierHash(spendingKey: string, rho: string, leafIndex: number): string {
  // Compute: nullifier = Poseidon(spendingKey, rho, leafIndex)
  const nullifier = hash.computePoseidonHashOnElements([spendingKey, rho, leafIndex.toString()]);

  return nullifier;
}

/**
 * Split u256 amount into low and high felts
 * Same format as deposit uses
 */
function splitU256(amount: bigint): { low: string; high: string } {
  const low = amount & ((1n << 128n) - 1n);
  const high = amount >> 128n;

  // IMPORTANT: Convert to decimal strings (base 10) for Cairo
  return {
    low: low.toString(10),
    high: high.toString(10),
  };
}

/**
 * Generate withdrawal proof
 *
 * For mock verifier:
 * - proof: Just 3 dummy felts (verifier only checks length)
 * - public_inputs: [merkle_root, nullifier, amount_low, amount_high, recipient]
 *   Must match contract extraction order!
 *
 * Contract extraction (shielded_pool.cairo):
 *   let root = *public_inputs.at(0);              // [0] merkle_root
 *   let nullifier_hash = *public_inputs.at(1);    // [1] nullifier
 *   let amount_low = *public_inputs.at(2);        // [2] amount_low
 *   let amount_high = *public_inputs.at(3);       // [3] amount_high
 *   // public_inputs.at(4) is recipient for proof verification
 *
 * The real security comes from:
 * 1. Nullifier prevents double-spending
 * 2. Only user with spending_key can compute correct nullifier
 * 3. Contract checks nullifier not already spent
 */
export async function generateWithdrawalProof(note: ShieldedNote, merkleRoot: string, recipient: string, spendingKey: string): Promise<WithdrawalProof> {
  // Compute nullifier hash
  // User must know spending_key to compute this correctly
  const leafIndex = parseInt(note.leafIndex || '0');
  const nullifierHash = computeNullifierHash(spendingKey, note.rho, leafIndex);

  // Split amount into u256 (low, high)
  const { low: amountLow, high: amountHigh } = splitU256(note.amount);

  // Prepare public inputs (5 felts as required by verifier)
  // IMPORTANT: Order must match contract's extraction!
  const publicInputs = [
    merkleRoot, // [0] Merkle root for proof verification
    nullifierHash, // [1] Nullifier to prevent double-spend
    amountLow, // [2] Amount low 128 bits
    amountHigh, // [3] Amount high 128 bits
    recipient, // [4] Recipient address for proof verification
  ];

  // Generate proof (3 felts as required by verifier)
  // For mock verifier, these can be any values
  // In production, these would be actual Groth16/Plonk proof elements
  const proof = [
    '0x1', // Dummy proof element 1
    '0x2', // Dummy proof element 2
    '0x3', // Dummy proof element 3
  ];

  return {
    proof,
    publicInputs,
    nullifierHash,
  };
}

/**
 * Verify commitment matches note parameters
 * Used to validate note before generating proof
 */
export function verifyNoteCommitment(note: ShieldedNote): boolean {
  if (!note.spendingKey) {
    return false;
  }

  const recomputedCommitment = hash.computePoseidonHashOnElements([note.amount.toString(), note.rho, note.rcm, note.spendingKey]);

  const isValid = recomputedCommitment === note.commitment;

  if (!isValid) {
    console.error('❌ Note commitment mismatch!', {
      stored: note.commitment.slice(0, 20) + '...',
      recomputed: recomputedCommitment.slice(0, 20) + '...',
    });
  }

  return isValid;
}

/**
 * Resolve spending key for a note without reading it from backend.
 * Priority:
 * 1) Keypair spending key (private local key)
 * 2) zkAddress felt (legacy transfer notes)
 */
export function resolveNoteSpendingKey(note: Pick<ShieldedNote, 'amount' | 'rho' | 'rcm' | 'commitment'>, userSpendingKey: string, zkAddress?: string): string {
  const candidates = [userSpendingKey];

  if (zkAddress?.startsWith('0zk')) {
    candidates.push('0x' + zkAddress.slice(3));
  }

  for (const candidate of candidates) {
    const recomputed = hash.computePoseidonHashOnElements([note.amount.toString(), note.rho, note.rcm, candidate]);

    if (recomputed === note.commitment) {
      return candidate;
    }
  }

  throw new Error('Cannot resolve spending key for note commitment');
}
