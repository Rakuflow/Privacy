import { useMemo } from "react";
import { useAccount, useProvider } from "@starknet-react/core";
import { ShieldedPoolService } from "../contracts/shieldedPoolService";
import { Account } from "starknet";

/**
 * Hook to interact with the Shielded Pool contract
 */
export function useShieldedPool() {
  const { account, address } = useAccount();
  const { provider } = useProvider();

  const service = useMemo(() => {
    if (!provider) return null;
    
    try {
      const poolService = new ShieldedPoolService(provider);
      
      if (account) {
        poolService.connectAccount(account as Account);
      }
      
      return poolService;
    } catch (error) {
      console.error("Failed to initialize ShieldedPoolService:", error);
      return null;
    }
  }, [provider, account]);

  return {
    service,
    isConnected: !!account,
    address,
  };
}