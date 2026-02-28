export interface DepositParams {
  amount: bigint;
  rho: string;
  rcm: string;
  spendingKey: string;
}

export interface ShieldedTransferParams {
  proof: string[];
  publicInputs: string[];
}

export interface WithdrawParams {
  proof: string[];
  publicInputs: string[];
  recipient: string;
}
