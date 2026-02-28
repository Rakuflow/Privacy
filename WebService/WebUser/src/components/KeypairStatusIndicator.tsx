import { useZkKeypair } from '../contexts/ZkKeypairContext';
import { useAccount } from '@starknet-react/core';
import { Shield, Check, AlertCircle } from 'lucide-react';
import { hasZkKeypair } from '../utils/zkStorage';
import { useEffect, useState } from 'react';

/**
 * Status indicator showing keypair state
 * Displays: ✅ Stored | ⚠️ Setup Required | 🔒 Not Connected
 */
export function KeypairStatusIndicator() {
  const { address } = useAccount();
  const { isReady } = useZkKeypair();
  const [isStored, setIsStored] = useState(false);

  useEffect(() => {
    if (address) {
      setIsStored(hasZkKeypair(address));
    } else {
      setIsStored(false);
    }
  }, [address, isReady]);

  if (!address) {
    return null; // Don't show when wallet not connected
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isReady ? (
        // Keypair loaded and ready
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/40 rounded-lg backdrop-blur-xl">
          <Check className="w-4 h-4 text-green-400" />
          <div className="text-xs">
            <p className="text-green-300 font-semibold">zk-Keypair Active</p>
            <p className="text-green-400/70">{isStored ? 'Stored' : 'Memory only'}</p>
          </div>
        </div>
      ) : (
        // Setup required
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 border border-amber-500/40 rounded-lg backdrop-blur-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <div className="text-xs">
            <p className="text-amber-300 font-semibold">Setup Required</p>
            <p className="text-amber-400/70">Generate keypair</p>
          </div>
        </div>
      )}
    </div>
  );
}
