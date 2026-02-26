import { useState, useEffect } from "react";
import { getUnspentNotesAsync } from "../utils/noteStorage";
import { useZkKeypair } from "../contexts/ZkKeypairContext";

/**
 * Hook to get shielded balance and auto-refresh
 */
export function useShieldedBalance() {
  const { keypair } = useZkKeypair();
  const [balance, setBalance] = useState<bigint>(0n);
  const [noteCount, setNoteCount] = useState(0);

  const refresh = async () => {
    if (keypair?.zkAddress) {
      const notes = await getUnspentNotesAsync(keypair.zkAddress);
      const bal = notes.reduce((sum, note) => sum + note.amount, 0n);
      setBalance(bal);
      setNoteCount(notes.length);
    } else {
      setBalance(0n);
      setNoteCount(0);
    }
  };

  useEffect(() => {
    refresh();

    // Keep light polling to avoid API spam
    const interval = setInterval(refresh, 30000);

    // Listen for custom event (when balance changes)
    const handleBalanceChange = () => {
      refresh();
    };

    window.addEventListener("shieldedBalanceChanged", handleBalanceChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("shieldedBalanceChanged", handleBalanceChange);
    };
  }, [keypair?.zkAddress]);

  return { balance, noteCount, refresh };
}
