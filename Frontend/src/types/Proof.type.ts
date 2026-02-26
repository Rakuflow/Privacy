export interface WithdrawalProof {
  proof: string[];
  publicInputs: string[];
  nullifierHash: string;
}

export interface GeneratedTransferProof {
  proof: string[];
  publicInputs: string[];
  nullifierHash: string;
  noteForRecipient: {
    amount: bigint;
    rho: string;
    rcm: string;
    commitment: string;
  };
  generatedBy?: string;
}
