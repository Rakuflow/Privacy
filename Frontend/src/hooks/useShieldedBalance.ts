import { useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { getShieldedBalance, getUnspentNotes } from "../utils/noteStorage";

/**
 * Hook to get shielded balance and auto-refresh
 */
export function useShieldedBalance() {
  const { address } = useAccount();
  const [balance, setBalance] = useState<bigint>(0n);
  const [noteCount, setNoteCount] = useState(0);

  const refresh = () => {
    if (address) {
      const bal = getShieldedBalance(address);
      const notes = getUnspentNotes(address);
      setBalance(bal);
      setNoteCount(notes.length);
    } else {
      setBalance(0n);
      setNoteCount(0);
    }
  };

  useEffect(() => {
    refresh();

    // Auto-refresh every 10 seconds to catch new deposits
    const interval = setInterval(refresh, 10000);

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("shieldedNotes_")) {
        refresh();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [address]);

  return { balance, noteCount, refresh };
}
