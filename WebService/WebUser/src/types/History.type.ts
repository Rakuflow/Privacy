export type HistoryType = "deposit" | "transfer" | "withdraw" | "received";

export interface HistoryEntry {
  type: HistoryType;
  transactionHash: string;
  timestamp: number;
  amount: bigint;
  recipientZkAddress?: string;
  recipientPublicAddress?: string;
}

export interface SaveHistoryRequest {
  zkAddress: string;
  type: HistoryType;
  transactionHash: string;
  timestamp: number;
  amount: string;
  recipientZkAddress?: string;
  recipientPublicAddress?: string;
}

export interface TransactionHistory {
  type: HistoryType;
  transactionHash: string;
  timestamp: number;
  amount: bigint;
  recipientZkAddress?: string;
  recipientPublicAddress?: string;
}
