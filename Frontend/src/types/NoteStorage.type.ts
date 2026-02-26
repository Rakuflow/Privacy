export interface ShieldedNote {
  amount: bigint;
  rho: string;
  rcm: string;
  spendingKey?: string;
  commitment: string;
  leafIndex?: string;
  isSpent?: boolean;
  transactionHash?: string;
}
