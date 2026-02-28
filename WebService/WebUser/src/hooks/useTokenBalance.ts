import { useState, useEffect, useMemo } from "react";
import { useAccount, useProvider } from "@starknet-react/core";
import { ERC20Service } from "../contracts/erc20Service";
import { TOKENS } from "../contracts/config";

export function useTokenBalance() {
  const { address } = useAccount();
  const { provider } = useProvider();
  const [balance, setBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strkService = useMemo(() => {
    if (!provider) return null;
    try {
      return new ERC20Service(provider, TOKENS.STRK.address);
    } catch (err) {
      console.error("Failed to create ERC20 service:", err);
      return null;
    }
  }, [provider]);

  const fetchBalance = async () => {
    if (!address || !strkService) {
      setBalance(0n);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const bal = await strkService.getBalance(address);
      setBalance(bal);
    } catch (err: any) {
      console.error("Failed to fetch balance:", err);
      setError(err?.message || "Failed to fetch balance");
      setBalance(0n);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address, strkService]);

  const formattedBalance = useMemo(() => {
    const decimals = TOKENS.STRK.decimals;
    const balanceStr = balance.toString();
    if (balanceStr === "0") return "0.00";
    
    // Convert to decimal format
    const len = balanceStr.length;
    if (len <= decimals) {
      const padded = balanceStr.padStart(decimals + 1, "0");
      const integer = padded.slice(0, -decimals) || "0";
      const decimal = padded.slice(-decimals);
      return `${integer}.${decimal.slice(0, 4)}`;
    } else {
      const integer = balanceStr.slice(0, len - decimals);
      const decimal = balanceStr.slice(len - decimals);
      return `${integer}.${decimal.slice(0, 4)}`;
    }
  }, [balance]);

  return {
    balance,
    formattedBalance,
    loading,
    error,
    refetch: fetchBalance,
    service: strkService,
  };
}