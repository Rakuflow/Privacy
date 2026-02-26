import { useEffect, useRef, useState } from 'react';
import { useZkKeypair } from '../../contexts/ZkKeypairContext';
import { getUnspentNotesAsync } from '../../utils/noteStorage';
import { TOKENS } from '../../contracts/config';
import { Wallet, Eye, EyeOff, Shield } from 'lucide-react';

export function MyAssets() {
  const { keypair } = useZkKeypair();
  const [shieldedBalance, setShieldedBalance] = useState<bigint>(0n);
  const [noteCount, setNoteCount] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const loadingRef = useRef(false);

  const refreshBalance = async () => {
    if (!keypair?.zkAddress) {
      setShieldedBalance(0n);
      setNoteCount(0);
      return;
    }

    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    try {
      const notes = await getUnspentNotesAsync(keypair.zkAddress);
      const balance = notes.reduce((sum, note) => sum + note.amount, 0n);
      setShieldedBalance(balance);
      setNoteCount(notes.length);
    } catch (error) {
      console.error('Failed to refresh shielded assets:', error);
    } finally {
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    refreshBalance();

    // Keep light polling and rely mainly on events.
    const interval = setInterval(refreshBalance, 30000);

    const handleBalanceChange = () => {
      refreshBalance();
    };

    window.addEventListener('shieldedBalanceChanged', handleBalanceChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('shieldedBalanceChanged', handleBalanceChange);
    };
  }, [keypair?.zkAddress]);

  const formatBalance = (balance: bigint) => {
    return (Number(balance) / 10 ** TOKENS.STRK.decimals).toFixed(4);
  };

  const usdValue = parseFloat(formatBalance(shieldedBalance)) * 0.046; // Mock price

  if (!keypair?.zkAddress) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <Wallet className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-2 sm:mb-3" />
        <p className="text-sm sm:text-base text-gray-400">Connect wallet to view your assets</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="p-4 sm:p-6 bg-gradient-to-br from-violet-500/20 via-indigo-500/20 to-purple-500/20 border border-violet-500/30 rounded-xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-32 h-32 sm:w-40 sm:h-40 bg-violet-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-32 h-32 sm:w-40 sm:h-40 bg-indigo-500/30 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
              <h3 className="text-xs sm:text-sm font-medium text-gray-300">Total Shielded Balance</h3>
            </div>
            <button onClick={() => setShowBalance(!showBalance)} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors">
              {showBalance ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
            </button>
          </div>

          <div className="mb-2">
            {showBalance ? (
              <>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">{formatBalance(shieldedBalance)} STRK</p>
                <p className="text-base sm:text-lg text-gray-400">≈ ${usdValue.toFixed(2)} USD</p>
              </>
            ) : (
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">••••••</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">Unspent Notes</p>
          <p className="text-2xl font-bold text-white">{noteCount}</p>
          <p className="text-xs text-violet-400 mt-1">Active commitments</p>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">Privacy Score</p>
          <p className="text-2xl font-bold text-green-400">High</p>
          <p className="text-xs text-gray-500 mt-1">{noteCount > 0 ? 'Protected' : 'No shielded funds'}</p>
        </div>
      </div>

      <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-violet-400" />
          Asset Breakdown
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full flex items-center justify-center text-xs font-bold">S</div>
              <div>
                <p className="font-medium text-white">STRK</p>
                <p className="text-xs text-gray-400">Starknet Token</p>
              </div>
            </div>
            <div className="text-right">
              {showBalance ? (
                <>
                  <p className="font-semibold text-white">{formatBalance(shieldedBalance)}</p>
                  <p className="text-xs text-gray-400">${usdValue.toFixed(2)}</p>
                </>
              ) : (
                <p className="font-semibold text-white">••••••</p>
              )}
            </div>
          </div>

          {noteCount === 0 && (
            <div className="text-center py-6 text-sm text-gray-500">
              <p>No shielded assets yet</p>
              <p className="text-xs mt-1">Make a deposit to get started</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-sm text-amber-300">
          <strong className="font-semibold">Security Reminder:</strong> Your shielded balance requires local key material. Back up your spending key to recover funds if browser data is lost.
        </p>
      </div>
    </div>
  );
}
