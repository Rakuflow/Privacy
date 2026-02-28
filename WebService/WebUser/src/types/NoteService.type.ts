export interface ShieldedNote {
  commitment: string;
  amount: string | number | bigint;
  rho: string;
  rcm: string;
  isSpent: boolean | string | number;
  leafIndex?: string;
  transactionHash?: string;
}

export interface SaveNoteRequest {
  zkAddress: string;
  commitment: string;
  amount: string;
  rho: string;
  rcm: string;
  leafIndex?: string;
  transactionHash?: string;
}
