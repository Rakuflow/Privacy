/**
 * Relayer Service - OPTION B: Gas Sponsorship Model
 *
 * User flow:
 * 1. Generate proof locally
 * 2. Sign relay intent
 * 3. Request fee estimate
 * 4. Approve fee payment
 * 5. Submit to relayer
 * 6. Relayer broadcasts (pays gas)
 * 7. Relayer collects fee from user
 */

import { Account } from 'starknet';
import { BaseApiService } from './BaseApiService';
import { API_ENDPOINTS } from '../config/urls';
import type { ApiResponse } from '../types/Api.type';
import { FeeEstimateRequest, FeeEstimateResponse, RelayerHealth, RelayIntent, RelayResult } from '../types/Relayer.type';

// ========================================
// RELAYER SERVICE
// ========================================

class RelayerService extends BaseApiService {
  constructor(baseUrl: string = API_ENDPOINTS.BASE_URL) {
    super(baseUrl);
  }

  // ========================================
  // PUBLIC API METHODS
  // ========================================

  /**
   * Check if relayer is available and has balance
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.getHealth();

      if (!response.success || !response.data) {
        return false;
      }

      const health = response.data;
      return health.status === 'ok' && BigInt(health.balance) > 0n;
    } catch (error) {
      console.error('Relayer availability check failed:', error);
      return false;
    }
  }

  /**
   * Get relayer health information
   */
  async getHealth(): Promise<ApiResponse<RelayerHealth>> {
    return this.get<RelayerHealth>('/health');
  }

  /**
   * Estimate fee for transaction
   */
  async estimateFee(request: FeeEstimateRequest): Promise<ApiResponse<FeeEstimateResponse>> {
    return this.post<FeeEstimateResponse>('/api/estimate-fee', request);
  }

  /**
   * Submit relay request
   */
  async submitRelay(intent: RelayIntent, quoteId?: string): Promise<ApiResponse<RelayResult>> {
    return this.post<RelayResult>('/api/relay', {
      intent,
      quoteId,
    });
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Sign relay intent with user wallet
   */
  async signRelayIntent(
    account: Account,
    type: 'transfer' | 'withdraw',
    proof: string[],
    publicInputs: string[],
    feeToken: 'STRK' | 'ETH' | 'USDC',
    maxFeeAmount: string,
    recipient?: string
  ): Promise<{
    intent: Omit<RelayIntent, 'signature'>;
    signature: string[];
  }> {
    const userAddress = account.address;
    const timestamp = Date.now();
    const nonce = this.generateNonce();

    const typedDataMessage = this.generateRelayIntentTypedData(type, proof, publicInputs, userAddress, feeToken, maxFeeAmount, nonce, timestamp, recipient);

    // Sign typed data
    const signature = await account.signMessage(typedDataMessage);

    const intent: Omit<RelayIntent, 'signature'> = {
      type,
      proof,
      publicInputs,
      recipient,
      userAddress,
      timestamp,
      nonce,
      feeToken,
      maxFeeAmount,
    };

    return {
      intent,
      signature: Array.isArray(signature) ? signature : [signature.r, signature.s],
    };
  }

  /**
   * Full flow: estimate fee → sign intent → relay
   */
  async relayWithFeeEstimate(
    account: Account,
    type: 'transfer' | 'withdraw',
    proof: string[],
    publicInputs: string[],
    feeToken: 'STRK' | 'ETH' | 'USDC' = 'STRK',
    recipient?: string
  ): Promise<{
    feeEstimate: FeeEstimateResponse;
    relay: () => Promise<ApiResponse<RelayResult>>;
  }> {
    // 1. Estimate fee
    const feeResponse = await this.estimateFee({
      type,
      proof,
      publicInputs,
      recipient,
      feeToken,
    });

    if (!feeResponse.success || !feeResponse.data) {
      throw new Error(feeResponse.error || 'Fee estimation failed');
    }

    const feeEstimate = feeResponse.data;

    if (!feeEstimate.success) {
      throw new Error('Fee estimation failed');
    }

    // 2. Sign intent with max fee from estimate
    const { intent, signature } = await this.signRelayIntent(account, type, proof, publicInputs, feeToken, feeEstimate.totalFee, recipient);

    const signedIntent: RelayIntent = {
      ...intent,
      signature,
    };

    // 3. Return estimate and relay function
    return {
      feeEstimate,
      relay: async () => {
        return this.submitRelay(signedIntent, feeEstimate.quoteId);
      },
    };
  }

  // ========================================
  // PRIVATE UTILITIES
  // ========================================

  /**
   * Generate relay intent typed data for signing
   */
  private generateRelayIntentTypedData(
    type: 'transfer' | 'withdraw',
    proof: string[],
    publicInputs: string[],
    userAddress: string,
    feeToken: 'STRK' | 'ETH' | 'USDC',
    maxFeeAmount: string,
    nonce: string,
    timestamp: number,
    recipient?: string
  ) {
    const proofHash = this.computePoseidonHash(proof);
    const publicInputsHash = this.computePoseidonHash(publicInputs);

    return {
      types: {
        StarkNetDomain: [
          { name: 'name', type: 'felt' },
          { name: 'version', type: 'felt' },
          { name: 'chainId', type: 'felt' },
        ],
        RelayIntent: [
          { name: 'type', type: 'felt' },
          { name: 'userAddress', type: 'felt' },
          { name: 'timestamp', type: 'felt' },
          { name: 'nonce', type: 'felt' },
          { name: 'feeToken', type: 'felt' },
          { name: 'maxFeeAmount', type: 'felt' },
          { name: 'proofHash', type: 'felt' },
          { name: 'publicInputsHash', type: 'felt' },
        ],
      },
      primaryType: 'RelayIntent',
      domain: {
        name: 'Starknet Shielded Pool Relayer',
        version: '1',
        chainId: '0x534e5f5345504f4c4941', // SN_SEPOLIA
      },
      message: {
        type: type === 'transfer' ? '0x1' : '0x2',
        userAddress,
        timestamp: '0x' + timestamp.toString(16),
        nonce,
        feeToken: this.getTokenFelt(feeToken),
        maxFeeAmount,
        proofHash,
        publicInputsHash,
      },
    };
  }

  private getTokenFelt(token: 'STRK' | 'ETH' | 'USDC'): string {
    const tokenMap: Record<string, string> = {
      STRK: '0x1',
      ETH: '0x2',
      USDC: '0x3',
    };
    return tokenMap[token] || '0x1';
  }

  private generateNonce(): string {
    return '0x' + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  private computePoseidonHash(elements: string[]): string {
    // Mock hash for now - in production use actual Poseidon
    // This should match backend implementation
    const combined = elements.join('');
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash = hash & hash;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(16, '0');
  }
}

// Export singleton instance
export const relayerService = new RelayerService();
