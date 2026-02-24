import { RpcProvider, CallData, cairo, num } from "starknet";

export class ERC20Service {
  private provider: RpcProvider;
  private tokenAddress: string;

  constructor(provider: RpcProvider, tokenAddress: string) {
    this.provider = provider;
    this.tokenAddress = tokenAddress;
  }

  async getBalance(accountAddress: string): Promise<bigint> {
    try {
      console.log("Fetching balance for:", accountAddress);
      console.log("Token address:", this.tokenAddress);
      
      // Direct RPC call instead of using Contract class
      const result = await this.provider.callContract({
        contractAddress: this.tokenAddress,
        entrypoint: "balance_of",
        calldata: CallData.compile([accountAddress]),
      });

      console.log("Balance result:", result);

      // Parse u256 result (low, high)
      if (result && result.length >= 2) {
        const low = BigInt(result[0]);
        const high = BigInt(result[1]);
        const balance = low + (high << 128n);
        console.log("Parsed balance:", balance.toString());
        return balance;
      }
      
      console.log("No balance found, returning 0");
      return 0n;
    } catch (error) {
      console.error("Failed to get balance:", error);
      return 0n;
    }
  }

  async getName(): Promise<string> {
    try {
      const result = await this.provider.callContract({
        contractAddress: this.tokenAddress,
        entrypoint: "name",
        calldata: [],
      });
      
      if (result && result[0]) {
        return cairo.felt252ToString(result[0]);
      }
      return "";
    } catch (error) {
      console.error("Failed to get name:", error);
      return "";
    }
  }

  async getSymbol(): Promise<string> {
    try {
      const result = await this.provider.callContract({
        contractAddress: this.tokenAddress,
        entrypoint: "symbol",
        calldata: [],
      });
      
      if (result && result[0]) {
        return cairo.felt252ToString(result[0]);
      }
      return "";
    } catch (error) {
      console.error("Failed to get symbol:", error);
      return "";
    }
  }

  async getDecimals(): Promise<number> {
    try {
      const result = await this.provider.callContract({
        contractAddress: this.tokenAddress,
        entrypoint: "decimals",
        calldata: [],
      });
      
      if (result && result[0]) {
        return Number(result[0]);
      }
      return 18;
    } catch (error) {
      console.error("Failed to get decimals:", error);
      return 18;
    }
  }

  async approve(spender: string, amount: bigint, account: any) {
    try {
      // For approve, we need to use the account to sign
      if (!account) {
        throw new Error("Account required for approval");
      }

      // Split u256 into low and high
      const amountLow = amount & ((1n << 128n) - 1n);
      const amountHigh = amount >> 128n;

      const tx = await account.execute({
        contractAddress: this.tokenAddress,
        entrypoint: "approve",
        calldata: CallData.compile({
          spender,
          amount: { low: amountLow, high: amountHigh },
        }),
      });
      
      return tx;
    } catch (error) {
      console.error("Failed to approve:", error);
      throw error;
    }
  }
}