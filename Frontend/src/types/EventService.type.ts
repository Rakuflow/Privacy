export interface DepositEventData {
  type: "deposit";
  commitment: string;
  leafIndex: string;
  amount: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export interface TransferEventData {
  type: "transfer";
  nullifierHash: string;
  commitmentOut: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export interface WithdrawEventData {
  type: "withdraw";
  nullifierHash: string;
  recipient: string;
  amount: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export type ShieldedEventData =
  | DepositEventData
  | TransferEventData
  | WithdrawEventData;
