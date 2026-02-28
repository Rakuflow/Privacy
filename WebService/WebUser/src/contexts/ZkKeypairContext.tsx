import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useAccount } from '@starknet-react/core';
import { saveZkKeypair, loadZkKeypair, clearZkKeypair } from '../utils/zkStorage';
import type { ZkKeypair, ZkKeypairContextValue } from '../types/ZkKeypair.type';

const ZkKeypairContext = createContext<ZkKeypairContextValue | undefined>(undefined);

// Add displayName for debugging
ZkKeypairContext.displayName = 'ZkKeypairContext';

export function ZkKeypairProvider({ children }: { children: ReactNode }) {
  const [keypair, setKeypairState] = useState<ZkKeypair | null>(null);
  const { address } = useAccount();
  const prevAddressRef = useRef<string | undefined>(address);

  // Auto-load keypair from localStorage whenever address changes
  useEffect(() => {
    if (!address) {
      // Wallet disconnected - clear memory but keep storage
      setKeypairState(null);
      prevAddressRef.current = undefined;
      return;
    }

    const prevAddress = prevAddressRef.current;

    // Case 1: First time connecting OR reconnecting (no prevAddress)
    if (!prevAddress) {
      const stored = loadZkKeypair(address);
      if (stored) {
        setKeypairState(stored);
      } else {
        setKeypairState(null);
      }
    }
    // Case 2: Wallet address changed (user switched wallet)
    else if (prevAddress !== address) {
      const stored = loadZkKeypair(address);
      if (stored) {
        setKeypairState(stored);
      } else {
        setKeypairState(null);
      }
    }
    // Case 3: Same address but keypair mismatch (safety check)
    else if (keypair && keypair.walletAddress && address && keypair.walletAddress.toLowerCase() !== address.toLowerCase()) {
      const stored = loadZkKeypair(address);
      setKeypairState(stored);
    }

    // Update previous address
    prevAddressRef.current = address;
  }, [address, keypair]);

  const setKeypair = (kp: ZkKeypair | null) => {
    if (kp) {
      // Save to localStorage when setting new keypair
      try {
        saveZkKeypair(kp);
      } catch (error) {
        console.error('Failed to save keypair to storage:', error);
        // Continue anyway - keypair will still work in memory
      }
    }
    setKeypairState(kp);
  };

  const clearKeypair = () => {
    if (address) {
      // Clear from localStorage
      clearZkKeypair(address);
    }
    setKeypairState(null);
  };

  const isReady = !!keypair;

  return <ZkKeypairContext.Provider value={{ keypair, setKeypair, clearKeypair, isReady }}>{children}</ZkKeypairContext.Provider>;
}

export function useZkKeypair() {
  const context = useContext(ZkKeypairContext);
  if (context === undefined) {
    throw new Error('useZkKeypair must be used within ZkKeypairProvider');
  }
  return context;
}
