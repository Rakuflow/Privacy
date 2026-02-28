export interface RelayIntent {
  type: 'transfer' | 'withdraw';
  proof: string[];
  publicInputs: string[];
  recipient?: string;
  userAddress: string;
  timestamp: number;
  nonce: string;
  signature: string[];
  feeToken: 'STRK' | 'ETH' | 'USDC';
  maxFeeAmount: string;
}

export interface FeeEstimateRequest {
  type: 'transfer' | 'withdraw';
  proof: string[];
  publicInputs: string[];
  recipient?: string;
  feeToken: 'STRK' | 'ETH' | 'USDC';
}

export interface FeeEstimateResponse {
  success: boolean;
  estimatedGasFee: string;
  serviceFee: string;
  totalFee: string;
  feeToken: string;
  expiresAt: number;
  quoteId: string;
}

export interface RelayRequest {
  intent: RelayIntent;
  quoteId?: string;
}

export interface RelayResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  feeCharged?: string;
  feeToken?: string;
  paymentTxHash?: string;
}

export interface RelayerHealth {
  status: 'ok' | 'error';
  relayerAddress: string;
  balance: string;
  version: string;
  uptime: number;
  feeCollectorBalance?: {
    STRK: string;
    ETH: string;
    USDC: string;
  };
}
