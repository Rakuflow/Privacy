/**
 * Transaction History Storage - Store user's transaction history separately from commitments
 */

export interface TransactionHistory {
  // Transaction metadata
  type: 'deposit' | 'received' | 'transfer' | 'withdraw';
  transactionHash: string;
  timestamp: number;

  // Amount info
  amount: bigint;

  // Optional fields
  recipientZkAddress?: string; // For transfers, show who received
}

/**
 * Save a transaction history entry
 */
export function saveHistory(zkAddress: string, history: TransactionHistory): void {
  const histories = getHistory(zkAddress);
  histories.push({
    ...history,
    amount: history.amount.toString(), // Convert BigInt to string for storage
  } as any);

  const key = `history_${zkAddress}`;
  localStorage.setItem(key, JSON.stringify(histories));

  console.log('✓ History saved:', {
    zkAddress: zkAddress.slice(0, 15) + '...',
    type: history.type,
    amount: (Number(history.amount) / 1e18).toFixed(4) + ' STRK',
    txHash: history.transactionHash.slice(0, 10) + '...',
  });
}

/**
 * Get all transaction history for a zkAddress
 */
export function getHistory(zkAddress: string): TransactionHistory[] {
  const key = `history_${zkAddress}`;
  const stored = localStorage.getItem(key);

  if (!stored) return [];

  try {
    const histories = JSON.parse(stored);
    // Convert amount strings back to BigInt
    return histories.map((h: any) => ({
      ...h,
      amount: BigInt(h.amount),
    }));
  } catch {
    return [];
  }
}

/**
 * Clear all history for a zkAddress
 */
export function clearHistory(zkAddress: string): void {
  const key = `history_${zkAddress}`;
  localStorage.removeItem(key);
  console.log('✓ History cleared for zkAddress:', zkAddress.slice(0, 15) + '...');
}

/**
 * Export history to JSON (for backup)
 */
export function exportHistory(zkAddress: string): string {
  const histories = getHistory(zkAddress);
  return JSON.stringify(histories, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2);
}

/**
 * Import history from JSON (for restore)
 */
export function importHistory(zkAddress: string, json: string): void {
  try {
    const histories = JSON.parse(json);
    const key = `history_${zkAddress}`;
    localStorage.setItem(key, JSON.stringify(histories));
    console.log('✓ History imported successfully for zkAddress:', zkAddress.slice(0, 15) + '...');
  } catch (error) {
    console.error('Failed to import history:', error);
    throw new Error('Invalid history backup file');
  }
}

/**
 * Debug: List all history keys in localStorage
 */
export function debugListAllHistoryKeys(): string[] {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith('history_'));
  console.log(
    '📦 All history keys:',
    keys.map((k) => k.slice(0, 30) + '...')
  );
  return keys;
}
