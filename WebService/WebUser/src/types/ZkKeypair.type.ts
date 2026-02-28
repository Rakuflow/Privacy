export interface ZkKeypair {
  spendingKey: string;
  spendingPubKey: string;
  zkAddress: string;
  walletAddress: string;
}

export interface ZkKeypairContextValue {
  keypair: ZkKeypair | null;
  setKeypair: (keypair: ZkKeypair | null) => void;
  clearKeypair: () => void;
  isReady: boolean;
}
