import { Account, RpcProvider, CallData } from 'starknet';
import { CONTRACTS } from './config';
import type { DepositParams, ShieldedTransferParams, WithdrawParams } from '../types/ShieldedPool.type';

export class ShieldedPoolService {
  private provider: RpcProvider;
  private account?: Account;

  constructor(provider: RpcProvider, account?: Account) {
    this.provider = provider;
    this.account = account;
  }

  /**
   * Connect an account for write operations
   */
  connectAccount(account: Account) {
    this.account = account;
  }

  /**
   * Deposit tokens into the shielded pool
   */
  async deposit(params: DepositParams) {
    if (!this.account) {
      throw new Error('Account required for deposit');
    }

    try {
      // Split u256 amount into low and high (convert to strings)
      const amountLow = (params.amount & ((1n << 128n) - 1n)).toString(10);
      const amountHigh = (params.amount >> 128n).toString(10);

      const tx = await this.account.execute({
        contractAddress: CONTRACTS.SHIELDED_POOL,
        entrypoint: 'deposit',
        calldata: CallData.compile({
          amount: { low: amountLow, high: amountHigh },
          rho: params.rho,
          rcm: params.rcm,
          spending_key: params.spendingKey,
        }),
      });

      return tx;
    } catch (error) {
      console.error('Deposit failed:', error);
      throw error;
    }
  }

  /**
   * Execute a shielded transfer
   */
  async shieldedTransfer(params: ShieldedTransferParams) {
    if (!this.account) {
      throw new Error('Account required for transfer');
    }

    try {
      const tx = await this.account.execute({
        contractAddress: CONTRACTS.SHIELDED_POOL,
        entrypoint: 'shielded_transfer',
        calldata: CallData.compile([params.proof, params.publicInputs]),
      });

      return tx;
    } catch (error) {
      console.error('Shielded transfer failed:', error);
      throw error;
    }
  }

  /**
   * Withdraw tokens from the shielded pool
   */
  async withdraw(params: WithdrawParams) {
    if (!this.account) {
      throw new Error('Account required for withdrawal');
    }

    try {
      const tx = await this.account.execute({
        contractAddress: CONTRACTS.SHIELDED_POOL,
        entrypoint: 'withdraw',
        calldata: CallData.compile([params.proof, params.publicInputs, params.recipient]),
      });

      return tx;
    } catch (error) {
      console.error('Withdraw failed:', error);
      throw error;
    }
  }

  /**
   * Get the current Merkle root
   */
  async getMerkleRoot(): Promise<string> {
    try {
      const result = await this.provider.callContract({
        contractAddress: CONTRACTS.SHIELDED_POOL,
        entrypoint: 'get_merkle_root',
        calldata: [],
      });

      if (result && result[0]) {
        return result[0];
      }
      return '0x0';
    } catch (error) {
      console.error('Get merkle root failed:', error);
      throw error;
    }
  }

  /**
   * Check if a nullifier has been spent
   */
  async isNullifierSpent(nullifierHash: string): Promise<boolean> {
    try {
      const result = await this.provider.callContract({
        contractAddress: CONTRACTS.SHIELDED_POOL,
        entrypoint: 'is_nullifier_spent',
        calldata: CallData.compile([nullifierHash]),
      });

      if (result && result[0]) {
        return result[0] !== '0x0';
      }
      return false;
    } catch (error) {
      console.error('Check nullifier failed:', error);
      throw error;
    }
  }

  /**
   * Verify a shielded transfer proof (read-only)
   */
  async verifyShieldedTransfer(proof: string[], publicInputs: string[]): Promise<boolean> {
    try {
      const result = await this.provider.callContract({
        contractAddress: CONTRACTS.GARAGA_VERIFIER,
        entrypoint: 'verify_shielded_transfer',
        calldata: CallData.compile([proof, publicInputs]),
      });

      if (result && result[0]) {
        return result[0] !== '0x0';
      }
      return false;
    } catch (error) {
      console.error('Verify shielded transfer failed:', error);
      throw error;
    }
  }

  /**
   * Verify a withdrawal proof (read-only)
   */
  async verifyWithdraw(proof: string[], publicInputs: string[]): Promise<boolean> {
    try {
      const result = await this.provider.callContract({
        contractAddress: CONTRACTS.GARAGA_VERIFIER,
        entrypoint: 'verify_withdraw',
        calldata: CallData.compile([proof, publicInputs]),
      });

      if (result && result[0]) {
        return result[0] !== '0x0';
      }
      return false;
    } catch (error) {
      console.error('Verify withdraw failed:', error);
      throw error;
    }
  }
}
