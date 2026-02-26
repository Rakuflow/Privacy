import { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { GlassCard } from '../components/GlassCard';
import { GlowButton } from '../components/GlowButton';
import { WalletButton } from '../components/WalletButton';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useZkAddress } from '../../hooks/useZkAddress';
import { useZkKeypair } from '../../contexts/ZkKeypairContext';
import { useTokenBalance } from '../../hooks/useTokenBalance';
import { TOKENS } from '../../contracts/config';
import { Shield, Copy, CheckCircle, ArrowDown, Send, ArrowUp, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard as copyText } from '../../utils/clipboard';
import { DepositModal } from '../components/DepositModal';
import { TransferModal } from '../components/TransferModal';
import { WithdrawModal } from '../components/WithdrawModal';
import { MyAssets } from '../components/MyAssets';
import { TransactionHistory } from '../components/TransactionHistory';
import { ZkKeypairSetup } from '../components/ZkKeypairSetup';
import { DebugLocalStorage } from '../components/DebugLocalStorage';

export function HomePage() {
  const { address, status } = useAccount();
  const zkAddress = useZkAddress();
  const { keypair, isReady, clearKeypair } = useZkKeypair();
  const { balance, loading: balanceLoading, refetch: refetchBalance } = useTokenBalance();
  const [copied, setCopied] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [zkSetupOpen, setZkSetupOpen] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  const formatBalance = (balance: bigint) => {
    return (Number(balance) / 10 ** TOKENS.STRK.decimals).toFixed(4);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await copyText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true);
    try {
      await refetchBalance();
      toast.success('Wallet balance updated!');
    } catch (error) {
      toast.error('Failed to refresh balance');
    } finally {
      setTimeout(() => setIsRefreshingBalance(false), 500);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <AnimatedBackground />

      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12 flex-1">
        {status === 'connected' && address ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Setup zk-Keypair Banner - Show if not ready */}
            {!isReady && (
              <GlassCard className="p-3 sm:p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-amber-300 mb-1">Setup Required</p>
                    <p className="text-xs sm:text-sm text-amber-200/80">Generate your zk-keypair to start using shielded transactions. This only takes one click!</p>
                  </div>
                  <GlowButton onClick={() => setZkSetupOpen(true)} className="w-full sm:w-auto">
                    <span>Setup Now</span>
                  </GlowButton>
                </div>
              </GlassCard>
            )}

            <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Public Address (0x...) */}
              <GlassCard className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs sm:text-sm text-gray-400">Public Wallet Address</span>
                  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">0x...</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs sm:text-sm truncate">
                    {address.slice(0, 10)}...{address.slice(-8)}
                  </p>
                  <button onClick={() => copyToClipboard(address)} className="p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0">
                    {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </GlassCard>

              {/* Shielded Address (0zk...) */}
              <GlassCard className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs sm:text-sm text-gray-400">Shielded Address</span>
                  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">0zk...</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {isReady ? (
                    <>
                      <p className="font-mono text-xs sm:text-sm text-violet-400 truncate">
                        {zkAddress.slice(0, 10)}...{zkAddress.slice(-8)}
                      </p>
                      <button onClick={() => copyToClipboard(zkAddress)} className="p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0">
                        {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-violet-400" />}
                      </button>
                    </>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-500 italic">Setup keypair to view</p>
                  )}
                </div>
              </GlassCard>

              {/* Wallet Balance Card */}
              <GlassCard className="p-3 sm:p-4 relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs sm:text-sm text-gray-400">Wallet Balance</span>
                      <button onClick={handleRefreshBalance} disabled={isRefreshingBalance} className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50" title="Refresh balance">
                        <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 hover:text-purple-400 transition-colors ${isRefreshingBalance ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <p className="text-lg sm:text-xl font-bold">{balanceLoading ? 'Loading...' : `${formatBalance(balance)} STRK`}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Available to deposit</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
                    <span className="text-[10px] sm:text-xs text-green-400">Starknet Sepolia</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-4 sm:p-6">
              <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Main Content - My Assets & Transaction History */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 justify-between">
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                        My Assets
                      </span>
                    </h3>
                    <MyAssets />
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                      <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                      Transaction History
                    </h3>
                    <TransactionHistory />
                  </div>
                </div>

                {/* Sidebar - Quick Actions */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
                  <GlowButton className="w-full" onClick={() => setDepositOpen(true)}>
                    <ArrowDown className="w-4 h-4" />
                    <span>Deposit</span>
                  </GlowButton>
                  <GlowButton variant="secondary" className="w-full" onClick={() => setTransferOpen(true)}>
                    <Send className="w-4 h-4" />
                    <span>Shielded Transfer</span>
                  </GlowButton>
                  <GlowButton variant="secondary" className="w-full" onClick={() => setWithdrawOpen(true)}>
                    <ArrowUp className="w-4 h-4" />
                    <span>Withdraw</span>
                  </GlowButton>

                  {/* Privacy Controls - Clear Keypair */}
                  {/* {isReady && (
                    <div className="mt-6 sm:mt-8 pt-4 border-t border-white/10">
                      <h4 className="text-sm font-semibold mb-3 text-gray-400">
                        Privacy
                      </h4>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to clear your stored zk-keypair? You can regenerate it by signing again.",
                            )
                          ) {
                            clearKeypair();
                            toast.success("Zk-keypair cleared from browser");
                          }
                        }}
                        className="w-full px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors text-red-400"
                      >
                        Clear Stored Keys
                      </button>
                    </div>
                  )} */}

                  {/* Additional Info */}
                  <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                    <p className="text-xs sm:text-sm text-violet-300 mb-2 font-semibold">💡 How it works</p>
                    <ul className="text-[10px] sm:text-xs text-gray-400 space-y-1.5 sm:space-y-2">
                      <li>• Deposit: Shield your tokens with zk-proofs</li>
                      <li>• Transfer: Send privately to other zk-addresses</li>
                      <li>• Withdraw: Unshield back to public wallet</li>
                    </ul>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        ) : (
          <div className="text-center py-12 sm:py-20">
            <GlassCard className="max-w-md mx-auto p-8 sm:p-12">
              <img src="/src/assets/Logo.png" alt="RakuShield Logo" className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Connect Your Wallet</h2>
              <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">Connect your Starknet wallet to start using the shielded pool</p>
              <WalletButton />
            </GlassCard>
          </div>
        )}
      </div>

      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
      <TransferModal open={transferOpen} onOpenChange={setTransferOpen} zkAddress={zkAddress} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
      <ZkKeypairSetup open={zkSetupOpen} onOpenChange={setZkSetupOpen} />
      <DebugLocalStorage />
      <Footer />
    </div>
  );
}
