import { useAccount, useDisconnect } from '@starknet-react/core';
import { GlowButton } from './GlowButton';
import { Wallet, RefreshCw } from 'lucide-react';
import { WalletConnectModal } from './WalletConnectModal';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTokenBalance } from '../../hooks/useTokenBalance';

export function WalletButton() {
  const { address, status } = useAccount();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);
  const { formattedBalance, loading, refetch } = useTokenBalance();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDisconnect = () => {
    disconnect();
    toast.success('Wallet disconnected');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Balance updated!');
    } catch (error) {
      toast.error('Failed to refresh balance');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  if (status === 'connected' && address) {
    return (
      <div className="flex items-center gap-4">
        {/* <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-400">Wallet Balance</span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
              title="Refresh balance"
            >
              <RefreshCw 
                className={`w-3 h-3 text-gray-400 hover:text-purple-400 transition-colors ${
                  isRefreshing ? 'animate-spin' : ''
                }`} 
              />
            </button>
          </div>
          <p className="font-semibold text-white">{formattedBalance} STRK</p>
        </div>
        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
          <span className="text-sm text-gray-400">Connected</span>
          <p className="text-white font-mono">{address.slice(0, 6)}...{address.slice(-4)}</p>
        </div> */}
        <div className="hidden sm:block px-3 py-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer" onClick={handleDisconnect}>
          <p className="font-mono text-sm text-white">Disconnect</p>
        </div>
      </div>
    );
  }

  if (status === 'connecting') {
    return <GlowButton disabled>Connecting...</GlowButton>;
  }

  return (
    <>
      <GlowButton onClick={() => setShowModal(true)}>
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </GlowButton>

      <WalletConnectModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
