export interface RelayIntent {
  // Transaction details
  type: "transfer" | "withdraw";
  proof: string[];
  publicInputs: string[];
  recipient?: string; // For withdraw only

  // User identity & signature
  userAddress: string; // User's wallet address
  timestamp: number; // Intent timestamp
  nonce: string; // Prevent replay attacks
  signature: string[]; // User's signature on intent

  // Fee payment
  feeToken: "STRK" | "ETH" | "USDC"; // Token user will pay fee in
  maxFeeAmount: string; // Max fee user willing to pay (in feeToken)
}

export interface FeeEstimateRequest {
  type: "transfer" | "withdraw";
  proof: string[];
  publicInputs: string[];
  recipient?: string;
  feeToken: "STRK" | "ETH" | "USDC";
}

export interface FeeEstimateResponse {
  success: boolean;
  estimatedGasFee: string; // In STRK (what relayer pays)
  serviceFee: string; // Service markup (10-20%)
  totalFee: string; // Total in requested feeToken
  feeToken: string;
  exchangeRate?: string; // If converting to different token
  expiresAt: number; // Quote expiration
  quoteId: string; // Reference for actual relay
}

export interface RelayRequest {
  intent: RelayIntent;
  quoteId?: string; // From fee estimation
}

export interface RelayResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  feeCharged?: string; // Actual fee charged
  feeToken?: string;
  paymentTxHash?: string; // Hash of fee payment transaction
}

export interface HealthResponse {
  status: "ok" | "error";
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

export interface SignatureVerificationResult {
  valid: boolean;
  error?: string;
  recoveredAddress?: string;
}

// Fee quote storage (in-memory cache)
export interface FeeQuote {
  quoteId: string;
  totalFee: string;
  feeToken: string;
  estimatedGasFee: string;
  createdAt: number;
  expiresAt: number;
}
