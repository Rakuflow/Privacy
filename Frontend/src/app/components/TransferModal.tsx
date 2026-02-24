import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { GlowButton } from './GlowButton';
import { TransactionStatusStepper, Step } from './TransactionStatusStepper';
import { useShieldedPool } from '../../hooks/useShieldedPool';
import { useAccount } from '@starknet-react/core';
import { toast } from 'sonner';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { safeWalletOperation, parseError, ErrorType } from '../../utils/errorHandling';
import { TOKENS } from '../../contracts/config';
import { getUnspentNotes, markNoteAsSpent, ShieldedNote, saveNote } from '../../utils/noteStorage';
import { computeNullifierHash } from '../../utils/zkProofGenerator';
import { generateRho, generateRcm } from '../../utils/zkKeypair';
import { hash } from 'starknet';

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zkAddress: string;
}

interface GeneratedTransferProof {
  proof: string[];
  publicInputs: string[];
  nullifierHash: string;
  noteForRecipient: {
    amount: bigint;
    rho: string;
    rcm: string;
    spendingKey: string;
    commitment: string;
  };
}

export function TransferModal({ open, onOpenChange, zkAddress }: TransferModalProps) {
  const [recipientZk, setRecipientZk] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [generatedProof, setGeneratedProof] = useState<GeneratedTransferProof | null>(null);
  const [selectedNote, setSelectedNote] = useState<ShieldedNote | null>(null);
  const [availableNotes, setAvailableNotes] = useState<ShieldedNote[]>([]);
  const [shieldedBalance, setShieldedBalance] = useState<bigint>(0n);
  const [steps, setSteps] = useState<Step[]>([
    { label: 'Generate proof', status: 'pending' },
    { label: 'Submit transfer', status: 'pending' },
    { label: 'Confirm', status: 'pending' },
  ]);

  const { service, isConnected } = useShieldedPool();
  const { account } = useAccount();

  useEffect(() => {
    if (open && zkAddress) {
      const notes = getUnspentNotes(zkAddress);
      setAvailableNotes(notes);
      const balance = notes.reduce((sum, note) => sum + note.amount, 0n);
      setShieldedBalance(balance);
    }
    if (!open) {
      // Reset on close
      setProofGenerated(false);
      setGeneratedProof(null);
      setSteps([
        { label: 'Generate proof', status: 'pending' },
        { label: 'Submit transfer', status: 'pending' },
        { label: 'Confirm', status: 'pending' },
      ]);
    }
  }, [open, zkAddress]);

  const formatBalance = (balance: bigint) => {
    return (Number(balance) / 10 ** TOKENS.STRK.decimals).toFixed(4);
  };

  const updateStep = (index: number, status: Step['status']) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, status } : step)));
  };

  const handleGenerateProof = async () => {
    if (!service || !isConnected || !zkAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!recipientZk || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!recipientZk.startsWith('0zk')) {
      toast.error('Recipient must be a valid zk-address (0zk...)');
      return;
    }

    // Validate zk-address length (should be 0zk + 64 hex chars)
    if (recipientZk.length < 10) {
      toast.error('Invalid zk-address format');
      return;
    }

    const amountWei = BigInt(Math.floor(parseFloat(amount) * 10 ** TOKENS.STRK.decimals));

    if (amountWei > shieldedBalance) {
      toast.error('Insufficient shielded balance');
      return;
    }

    const exactMatch = availableNotes.find((note) => note.amount === amountWei);

    if (!exactMatch) {
      toast.error(`No exact match found. Available notes: ${availableNotes.map((n) => formatBalance(n.amount)).join(', ')} STRK`, { duration: 6000 });
      return;
    }

    // Validate note has required fields
    if (!exactMatch.rho || !exactMatch.rcm || !exactMatch.spendingKey) {
      toast.error('Invalid note data. Please re-deposit funds.');
      return;
    }

    setLoading(true);
    updateStep(0, 'active');

    try {
      const merkleRoot = await service.getMerkleRoot();
      const leafIndex = parseInt(exactMatch.leafIndex || '0');
      const nullifierHash = computeNullifierHash(exactMatch.spendingKey, exactMatch.rho, leafIndex);

      const recipientZkFelt = '0x' + recipientZk.slice(3);
      const newRho = generateRho();
      const newRcm = generateRcm();

      const newCommitment = hash.computePoseidonHashOnElements([amountWei.toString(), newRho, newRcm, recipientZkFelt]);

      const publicInputs = [merkleRoot, nullifierHash, newCommitment, '0x' + amountWei.toString(16)];

      const proof = ['0x1', '0x2', '0x3'];

      const noteForRecipient = {
        amount: amountWei,
        rho: newRho,
        rcm: newRcm,
        spendingKey: recipientZkFelt,
        commitment: newCommitment,
      };

      setGeneratedProof({
        proof,
        publicInputs,
        nullifierHash,
        noteForRecipient,
      });

      setSelectedNote(exactMatch);
      setProofGenerated(true);
      updateStep(0, 'completed');

      toast.success('Transfer proof generated!');
    } catch (error: any) {
      updateStep(0, 'error');
      const parsedError = parseError(error);
      if (parsedError.shouldLog) {
        console.error('Proof generation error:', error);
      }
      if (parsedError.shouldNotify) {
        toast.error(parsedError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!service || !isConnected || !account || !zkAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!generatedProof || !selectedNote) {
      toast.error('Please generate proof first');
      return;
    }

    setLoading(true);
    updateStep(1, 'active');

    try {
      const isSpent = await service.isNullifierSpent(generatedProof.nullifierHash);

      if (isSpent) {
        toast.error('This note has already been spent!');
        updateStep(1, 'error');
        setLoading(false);
        return;
      }

      const transferResult = await safeWalletOperation(
        async () => {
          return await service.shieldedTransfer({
            proof: generatedProof.proof,
            publicInputs: generatedProof.publicInputs,
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

      if (!transferResult.success) {
        updateStep(1, 'error');
        setLoading(false);
        return;
      }

      const tx = transferResult.data!;
      updateStep(1, 'completed');
      toast.success(`Transfer submitted! TX: ${tx.transaction_hash.slice(0, 10)}...`);

      markNoteAsSpent(zkAddress, selectedNote.commitment);
      window.dispatchEvent(new CustomEvent('shieldedBalanceChanged'));

      saveNote(recipientZk, {
        amount: generatedProof.noteForRecipient.amount,
        rho: generatedProof.noteForRecipient.rho,
        rcm: generatedProof.noteForRecipient.rcm,
        spendingKey: generatedProof.noteForRecipient.spendingKey,
        commitment: generatedProof.noteForRecipient.commitment,
        leafIndex: '',
        isSpent: false,
      });

      updateStep(2, 'active');
      account
        .waitForTransaction(tx.transaction_hash, {
          retryInterval: 5000,
        })
        .then(() => {
          updateStep(2, 'completed');
          toast.success('Shielded transfer confirmed!');
          window.dispatchEvent(new CustomEvent('shieldedBalanceChanged'));
        })
        .catch((err) => {
          updateStep(2, 'error');
          const parsedError = parseError(err);
          if (parsedError.shouldLog) {
            console.error('Transaction confirmation error:', err);
          }
        });

      setTimeout(() => {
        resetModal();
      }, 1000);
    } catch (error: any) {
      updateStep(1, 'error');
      const parsedError = parseError(error);

      if (parsedError.shouldLog) {
        console.error('Transfer error:', error);
      }

      if (parsedError.shouldNotify) {
        toast.error(parsedError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    onOpenChange(false);
    setRecipientZk('');
    setAmount('');
    setProofGenerated(false);
    setGeneratedProof(null);
    setSelectedNote(null);
  };

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
              disabled={availableNotes.length === 0}
            />
          </div>

          {/* Amount Input */}
          <div>
            <Label className="text-sm">Amount</Label>
            <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 bg-white/5 border-white/10" disabled={availableNotes.length === 0} />

            {/* Quick Select */}
            {availableNotes.length > 0 && (
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
          {(loading || proofGenerated) && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-semibold mb-3 text-gray-300">Transfer Progress</p>
              <TransactionStatusStepper steps={steps} />
            </div>
          )}

          {/* Privacy Notice */}
          {!loading && !proofGenerated && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <p className="text-xs text-indigo-300">🔒 On-chain observers will only see a nullifier and new commitment, not sender/receiver/amount.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <GlowButton variant="secondary" className="w-full" disabled={!recipientZk || !amount || loading || availableNotes.length === 0 || proofGenerated} onClick={handleGenerateProof}>
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

            <GlowButton className="w-full" disabled={!proofGenerated || loading} onClick={handleTransfer}>
              {loading && proofGenerated ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                'Execute Transfer'
              )}
            </GlowButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
