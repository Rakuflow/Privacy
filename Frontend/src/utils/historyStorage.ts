/**
 * Transaction History Storage - Store user's transaction history via API
 */

import { historyService, HistoryEntry } from '../services/HistoryService';

export interface TransactionHistory {
  type: "deposit" | "received" | "transfer" | "withdraw";
  transactionHash: string;
  timestamp: number;
  amount: bigint;
  recipientZkAddress?: string;
  recipientPublicAddress?: string;
}

// Save history entry to backend
export async function saveHistory(zkAddress: string, history: TransactionHistory): Promise<void> {
  try {
    const response = await historyService.saveHistory({
      zkAddress,
      type: history.type,
      transactionHash: history.transactionHash,
      timestamp: history.timestamp,
      amount: history.amount.toString(),
      recipientZkAddress: history.recipientZkAddress,
      recipientPublicAddress: history.recipientPublicAddress,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to save history');
    }

    console.log("✓ History saved:", {
      zkAddress: zkAddress.slice(0, 15) + "...",
      type: history.type,
      amount: (Number(history.amount) / 1e18).toFixed(4) + " STRK",
      txHash: history.transactionHash.slice(0, 10) + "...",
    });
  } catch (error) {
    console.error("Failed to save history:", error);
    throw error;
  }
}

// Get transaction history from backend
export async function getHistory(zkAddress: string): Promise<TransactionHistory[]> {
  try {
    const response = await historyService.getHistory(zkAddress);

    if (!response.success || !response.data) {
      return [];
    }

    return response.data.history.map((h: any) => ({
      ...h,
      amount: BigInt(h.amount),
    }));
  } catch (error) {
    console.error("Failed to get history:", error);
    return [];
  }
}

// Export history to JSON (for backup)
export function exportHistory(history: TransactionHistory[]): string {
  return JSON.stringify(history, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2);
}
