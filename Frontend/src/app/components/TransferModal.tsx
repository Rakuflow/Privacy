import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { GlowButton } from './GlowButton';
import { TransactionStatusStepper } from './TransactionStatusStepper';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { TOKENS } from '../../contracts/config';
import { useTransfer } from '../../hooks/useTransfer';

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zkAddress: string;
}

export function TransferModal({ open, onOpenChange, zkAddress }: TransferModalProps) {
  const {
    recipientZk,
    setRecipientZk,
    amount,
    setAmount,
    loading,
    proofGenerated,
    availableNotes,
    shieldedBalance,
    steps,
    formatBalance,
    handleGenerateProof,
    handleTransfer,
    resetForm,
    isCompleted,
  } = useTransfer(open, zkAddress);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md bg-gray-900/95 backdrop-blur-xl border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">Shielded Transfer</DialogTitle>
          <DialogDescription className="text-gray-400">Send funds privately using zero-knowledge proofs</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Balance Info */}
          <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
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

          {/* Recipient Input */}
          <div>
            <Label className="text-sm">Recipient zk-Address</Label>
            <Input
              placeholder="0zk..."
              value={recipientZk}
              onChange={(e) => setRecipientZk(e.target.value)}
              className="mt-2 bg-white/5 border-white/10 font-mono text-sm"
              disabled={availableNotes.length === 0 || isCompleted}
            />
          </div>

          {/* Amount Input */}
          <div>
            <Label className="text-sm">Amount</Label>
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
                      className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded text-xs text-indigo-300 transition-colors"
                    >
                      {formatBalance(note.amount)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-amber-300 mt-1.5">⚠️ Exact match required</p>
              </div>
            )}
          </div>

          {/* Status Stepper */}
          {(loading || proofGenerated || steps[2].status === 'active' || isCompleted) && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-semibold mb-3 text-gray-300">Transfer Progress</p>
              <TransactionStatusStepper steps={steps} />
            </div>
          )}

          {/* Privacy Notice */}
          {!loading && !proofGenerated && steps[2].status === 'pending' && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <p className="text-xs text-indigo-300">🔒 On-chain observers will only see a nullifier and new commitment, not sender/receiver/amount.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!isCompleted ? (
              <>
                <GlowButton
                  variant="secondary"
                  className="w-full"
                  disabled={!recipientZk || !amount || loading || availableNotes.length === 0 || proofGenerated || steps[2].status === 'active'}
                  onClick={handleGenerateProof}
                >
                  {loading && !proofGenerated ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Proof...</span>
                    </>
                  ) : proofGenerated ? (
                    'Proof Generated ✓'
                  ) : (
                    'Generate Transfer Proof'
                  )}
                </GlowButton>

                <GlowButton className="w-full" disabled={!proofGenerated || loading || steps[1].status === 'completed' || steps[2].status === 'active'} onClick={handleTransfer}>
                  {loading && proofGenerated ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Execute Transfer'
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
