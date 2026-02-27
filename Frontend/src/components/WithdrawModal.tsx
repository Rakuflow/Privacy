import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { GlowButton } from './GlowButton';
import { TransactionStatusStepper } from './TransactionStatusStepper';
import { Loader2, AlertCircle, ArrowDown, Info, Shield } from 'lucide-react';
import { TOKENS } from '../contracts/config';
import { useWithdraw } from '../hooks/useWithdraw';
import { useAccount } from '@starknet-react/core';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WithdrawModal({ open, onOpenChange }: WithdrawModalProps) {
  const {
    amount,
    setAmount,
    recipient,
    setRecipient,
    loading,
    proofGenerated,
    availableNotes,
    shieldedBalance,
    useMultiNote,
    selectedNotes,
    steps,
    formatBalance,
    handleGenerateProof,
    handleWithdraw,
    resetForm,
    isCompleted,
  } = useWithdraw(open);

  const { address } = useAccount();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md bg-gray-900/95 backdrop-blur-xl border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Withdraw from Pool</DialogTitle>
          <DialogDescription className="text-gray-400">Unshield your funds to a public address</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Balance Info */}
          <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">Shielded Balance</span>
              </div>
              <span className="text-sm font-semibold text-white">{formatBalance(shieldedBalance)} STRK</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{availableNotes.length} unspent notes</p>
          </div>

          {availableNotes.length === 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300">No shielded funds. Deposit first.</p>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <Label className="text-sm">Amount to Withdraw</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2 bg-white/5 border-white/10"
              disabled={availableNotes.length === 0 || isCompleted}
            />

            {/* Quick Select */}
            {availableNotes.length > 0 && !isCompleted && (
              <div className="mt-2 p-2 bg-white/5 border border-white/10 rounded">
                <p className="text-xs text-gray-400 mb-1.5">Quick Select:</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableNotes.map((note, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAmount((Number(note.amount) / 10 ** TOKENS.STRK.decimals).toString())}
                      className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded text-xs text-purple-300 transition-colors"
                    >
                      {formatBalance(note.amount)}
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 p-1.5 bg-blue-500/10 border border-blue-500/20 rounded flex gap-1.5">
                  <Info className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300">Multi-note: Auto combines notes if needed (multiple txs, higher gas)</p>
                </div>
              </div>
            )}
          </div>

          {/* Recipient Input */}
          <div>
            <Label className="text-sm">Recipient Public Address</Label>
            <Input placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} className="mt-2 bg-white/5 border-white/10 font-mono text-sm" disabled={isCompleted} />
          </div>

          {/* Multi-Note Info */}
          {proofGenerated && useMultiNote && selectedNotes.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm font-semibold text-amber-300 mb-1">Multi-Note: {selectedNotes.length} transactions</p>
              <p className="text-xs text-amber-200/80">This will execute {selectedNotes.length} separate withdrawals (higher gas cost)</p>
            </div>
          )}

          {/* Status Stepper */}
          {(loading || proofGenerated || steps[2].status === 'active' || isCompleted) && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-semibold mb-3 text-gray-300">Withdrawal Progress</p>
              <TransactionStatusStepper steps={steps} />
            </div>
          )}

          {/* Privacy Notice */}
          {!loading && !proofGenerated && steps[2].status === 'pending' && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-xs text-purple-300">⚠️ Withdrawing will unshield funds. On-chain observers will see recipient & amount, but not which note was spent.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!isCompleted ? (
              <>
                <GlowButton
                  variant="secondary"
                  className="w-full"
                  disabled={!amount || !recipient || loading || availableNotes.length === 0 || proofGenerated || steps[2].status === 'active'}
                  onClick={handleGenerateProof}
                >
                  {loading && !proofGenerated ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Proof...</span>
                    </>
                  ) : proofGenerated ? (
                    `Proof${useMultiNote ? 's' : ''} Generated ✓`
                  ) : (
                    'Generate Withdrawal Proof'
                  )}
                </GlowButton>

                <GlowButton className="w-full" disabled={!proofGenerated || loading || steps[1].status === 'completed' || steps[2].status === 'active'} onClick={handleWithdraw}>
                  {loading && proofGenerated ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{useMultiNote ? `Executing ${selectedNotes.length} Withdrawals...` : 'Submitting...'}</span>
                    </>
                  ) : (
                    `Execute Withdrawal${useMultiNote ? ` (${selectedNotes.length} notes)` : ''}`
                  )}
                </GlowButton>
              </>
            ) : (
              <GlowButton className="w-full" onClick={resetForm}>
                New Transaction
              </GlowButton>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
