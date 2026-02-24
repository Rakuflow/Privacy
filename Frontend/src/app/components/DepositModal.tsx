import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { GlowButton } from './GlowButton';
import { TransactionStatusStepper, Step } from './TransactionStatusStepper';
import { useShieldedPool } from '../../hooks/useShieldedPool';
import { useTokenBalance } from '../../hooks/useTokenBalance';
import { useAccount } from '@starknet-react/core';
import { useZkKeypair } from '../../contexts/ZkKeypairContext';
import { toast } from 'sonner';
import { Loader2, Coins, AlertCircle } from 'lucide-react';
import { TOKENS, CONTRACTS } from '../../contracts/config';
import { generateRho, generateRcm } from '../../utils/zkKeypair';
import { ZkKeypairSetup } from './ZkKeypairSetup';
import { saveNote } from '../../utils/noteStorage';
import { hash } from 'starknet';
import { safeWalletOperation, parseError, ErrorType } from '../../utils/errorHandling';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeypairSetup, setShowKeypairSetup] = useState(false);
  const [steps, setSteps] = useState<Step[]>([
    { label: 'Approve tokens', status: 'pending' },
    { label: 'Submit deposit', status: 'pending' },
    { label: 'Confirm', status: 'pending' },
  ]);

  const { service, isConnected } = useShieldedPool();
  const { formattedBalance, balance, refetch, service: erc20Service } = useTokenBalance();
  const { account, address } = useAccount();
  const { keypair, isReady } = useZkKeypair();

  // Reset steps when modal closes
  useEffect(() => {
    if (!open) {
      setSteps([
        { label: 'Approve tokens', status: 'pending' },
        { label: 'Submit deposit', status: 'pending' },
        { label: 'Confirm', status: 'pending' },
      ]);
    }
  }, [open]);

  const updateStep = (index: number, status: Step['status']) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, status } : step)));
  };

  const handleDeposit = async () => {
    if (!service || !isConnected || !account || !erc20Service || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!keypair || !isReady) {
      toast.error('Please setup your zk-keypair first');
      setShowKeypairSetup(true);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 10 ** TOKENS.STRK.decimals));

      if (amountWei > balance) {
        toast.error('Insufficient balance');
        setLoading(false);
        return;
      }

      // Step 1: Approve
      updateStep(0, 'active');
      const approveResult = await safeWalletOperation(
        async () => {
          return await erc20Service.approve(CONTRACTS.SHIELDED_POOL, amountWei, account);
        },
        {
          onError: (error) => {
            if (error.type !== ErrorType.USER_REJECTED && error.shouldNotify) {
              toast.error(error.userMessage);
            }
          },
        }
      );

      if (!approveResult.success) {
        updateStep(0, 'error');
        setLoading(false);
        return;
      }
      updateStep(0, 'completed');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 2: Deposit
      updateStep(1, 'active');
      const rho = generateRho();
      const rcm = generateRcm();
      const spendingKey = keypair.spendingKey;

      const depositResult = await safeWalletOperation(
        async () => {
          return await service.deposit({
            amount: amountWei,
            rho,
            rcm,
            spendingKey,
          });
        },
        {
          onError: (error) => {
            if (error.type !== ErrorType.USER_REJECTED && error.shouldNotify) {
              toast.error(error.userMessage);
            }
          },
        }
      );

      if (!depositResult.success) {
        updateStep(1, 'error');
        setLoading(false);
        return;
      }

      const depositTx = depositResult.data!;
      updateStep(1, 'completed');
      toast.success(`Deposit submitted! TX: ${depositTx.transaction_hash.slice(0, 10)}...`);

      // Compute commitment and save note
      const commitment = hash.computePoseidonHashOnElements([amountWei.toString(), rho, rcm, spendingKey]);

      saveNote(keypair.zkAddress, {
        amount: amountWei,
        rho,
        rcm,
        spendingKey,
        commitment,
        transactionHash: depositTx.transaction_hash,
        timestamp: Date.now(),
        isSpent: false,
        type: 'deposit',
      });

      window.dispatchEvent(new CustomEvent('shieldedBalanceChanged'));
      setTimeout(() => refetch(), 2000);

      // Step 3: Confirmation (background)
      updateStep(2, 'active');
      account
        .waitForTransaction(depositTx.transaction_hash, {
          retryInterval: 5000,
        })
        .then(() => {
          updateStep(2, 'completed');
          toast.success('Deposit confirmed on-chain!');
          refetch();
          window.dispatchEvent(new CustomEvent('shieldedBalanceChanged'));
        })
        .catch((err) => {
          updateStep(2, 'error');
          const parsedError = parseError(err);
          if (parsedError.shouldLog) {
            console.error('Transaction confirmation error:', err);
          }
        });

      // Close modal after submission
      setTimeout(() => {
        onOpenChange(false);
        setAmount('');
      }, 1000);
    } catch (error: any) {
      const parsedError = parseError(error);
      if (parsedError.shouldLog) {
        console.error('Deposit error:', error);
      }
      if (parsedError.shouldNotify) {
        toast.error(parsedError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md bg-gray-900/95 backdrop-blur-xl border-white/10 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Deposit to Shielded Pool</DialogTitle>
            <DialogDescription className="text-gray-400">Shield your tokens with zero-knowledge proofs</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Setup Warning */}
            {(!keypair || !isReady) && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-300 mb-1">Setup Required</p>
                  <button onClick={() => setShowKeypairSetup(true)} className="text-xs text-amber-400 hover:text-amber-300 underline">
                    Setup zk-Keypair Now →
                  </button>
                </div>
              </div>
            )}

            {/* Balance Info */}
            <div className="p-3 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-gray-400">{TOKENS.STRK.symbol}</span>
                </div>
                <span className="text-sm font-semibold text-white">{formattedBalance} STRK</span>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm">Amount</Label>
                <button onClick={() => setAmount((Number(balance) / 10 ** TOKENS.STRK.decimals).toString())} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Max
                </button>
              </div>
              <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-white/5 border-white/10" />
            </div>

            {/* Status Stepper */}
            {loading && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <p className="text-sm font-semibold mb-3 text-gray-300">Transaction Progress</p>
                <TransactionStatusStepper steps={steps} />
              </div>
            )}

            {/* Privacy Notice */}
            {!loading && (
              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                <p className="text-xs text-violet-300">🔒 Your deposit will be shielded using a zk-commitment. Only you will know the amount and your zk-address.</p>
              </div>
            )}

            <GlowButton className="w-full" disabled={!amount || loading || !keypair || !isReady} onClick={handleDeposit}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Generate Commitment & Deposit</span>
              )}
            </GlowButton>
          </div>
        </DialogContent>
      </Dialog>

      <ZkKeypairSetup
        open={showKeypairSetup}
        onOpenChange={setShowKeypairSetup}
        onKeypairCreated={() => {
          setShowKeypairSetup(false);
          toast.success('Ready to deposit!');
        }}
      />
    </>
  );
}
