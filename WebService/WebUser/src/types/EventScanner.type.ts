export interface DepositEventData {
  commitment: string;
  leaf_index: string;
  amount: string;
  blockNumber: number;
  transactionHash: string;
}

export interface TransferEventData {
  nullifier_hash: string;
  commitment_out: string;
  blockNumber: number;
  transactionHash: string;
}

export interface WithdrawEventData {
  nullifier_hash: string;
  recipient: string;
  amount: string;
  blockNumber: number;
  transactionHash: string;
}
