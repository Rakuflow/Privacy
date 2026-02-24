import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { GlowButton } from "./GlowButton";
import { TransactionStatusStepper, Step } from "./TransactionStatusStepper";
import { useShieldedPool } from "../../hooks/useShieldedPool";
import { useAccount } from "@starknet-react/core";
import { useZkKeypair } from "../../contexts/ZkKeypairContext";
import { toast } from "sonner";
import { Loader2, AlertCircle, ArrowDown, Info } from "lucide-react";
import { safeWalletOperation, parseError, ErrorType } from "../../utils/errorHandling";
import { getUnspentNotes, markNoteAsSpent, ShieldedNote } from "../../utils/noteStorage";
import { generateWithdrawalProof, verifyNoteCommitment } from "../../utils/zkProofGenerator";
import { TOKENS } from "../../contracts/config";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WithdrawModal({ open, onOpenChange }: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [generatedProof, setGeneratedProof] = useState<any>(null);
  const [selectedNote, setSelectedNote] = useState<ShieldedNote | null>(null);
  const [availableNotes, setAvailableNotes] = useState<ShieldedNote[]>([]);
  const [shieldedBalance, setShieldedBalance] = useState<bigint>(0n);
  const [useMultiNote, setUseMultiNote] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<ShieldedNote[]>([]);
  const [multiNoteProofs, setMultiNoteProofs] = useState<any[]>([]);
  const [steps, setSteps] = useState<Step[]>([
    { label: "Generate proof", status: "pending" },
    { label: "Submit withdrawal", status: "pending" },
    { label: "Confirm on-chain", status: "pending" },
  ]);
  
  const { service, isConnected } = useShieldedPool();
  const { account, address } = useAccount();
  const { keypair } = useZkKeypair();

  useEffect(() => {
    if (open && keypair?.zkAddress) {
      const notes = getUnspentNotes(keypair.zkAddress);
      setAvailableNotes(notes);
      const balance = notes.reduce((sum, note) => sum + note.amount, 0n);
      setShieldedBalance(balance);
      
      if (!recipient && address) {
        setRecipient(address);
      }
    }
    if (!open) {
      setProofGenerated(false);
      setGeneratedProof(null);
      setUseMultiNote(false);
      setSelectedNotes([]);
      setMultiNoteProofs([]);
      setSteps([
        { label: "Generate proof", status: "pending" },
        { label: "Submit withdrawal", status: "pending" },
        { label: "Confirm on-chain", status: "pending" },
      ]);
    }
  }, [open, keypair?.zkAddress, address]);

  const formatBalance = (balance: bigint) => {
    return (Number(balance) / 10 ** TOKENS.STRK.decimals).toFixed(4);
  };

  const updateStep = (index: number, status: Step["status"]) => {
    setSteps(prev => prev.map((step, i) => i === index ? { ...step, status } : step));
  };

  const findNotesCombination = (targetAmount: bigint): ShieldedNote[] | null => {
    const sorted = [...availableNotes].sort((a, b) => Number(a.amount - b.amount));
    
    const findCombination = (remaining: bigint, startIdx: number, current: ShieldedNote[]): ShieldedNote[] | null => {
      if (remaining === 0n) return current;
      if (remaining < 0n || startIdx >= sorted.length) return null;
      
      const withCurrent = findCombination(
        remaining - sorted[startIdx].amount,
        startIdx + 1,
        [...current, sorted[startIdx]]
      );
      if (withCurrent) return withCurrent;
      
      return findCombination(remaining, startIdx + 1, current);
    };
    
    return findCombination(targetAmount, 0, []);
  };

  const handleGenerateProof = async () => {
    if (!service || !isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amount || !recipient) {
      toast.error("Please fill in all fields");
      return;
    }

    const amountWei = BigInt(Math.floor(parseFloat(amount) * 10 ** TOKENS.STRK.decimals));

    if (amountWei > shieldedBalance) {
      toast.error("Insufficient shielded balance");
      return;
    }

    const exactMatch = availableNotes.find(note => note.amount === amountWei);
    
    if (exactMatch) {
      setUseMultiNote(false);
      await generateSingleNoteProof(exactMatch);
    } else {
      const combination = findNotesCombination(amountWei);
      
      if (!combination || combination.length === 0) {
        toast.error(
          `Cannot withdraw ${formatBalance(amountWei)} STRK. No combination found.`,
          { duration: 6000 }
        );
        return;
      }
      
      setUseMultiNote(true);
      await generateMultiNoteProofs(combination);
    }
  };

  const generateSingleNoteProof = async (noteToSpend: ShieldedNote) => {
    setLoading(true);
    updateStep(0, "active");
    
    try {
      if (!verifyNoteCommitment(noteToSpend)) {
        toast.error("Invalid note commitment.");
        updateStep(0, "error");
        setLoading(false);
        return;
      }

      const merkleRoot = await service.getMerkleRoot();
      const proof = await generateWithdrawalProof(noteToSpend, merkleRoot, recipient);

      toast.success("Withdrawal proof generated!");
      updateStep(0, "completed");
      setProofGenerated(true);
      setGeneratedProof(proof);
      setSelectedNote(noteToSpend);
    } catch (error: any) {
      updateStep(0, "error");
      const parsedError = parseError(error);
      if (parsedError.shouldLog) {
        console.error("Proof generation error:", error);
      }
      if (parsedError.shouldNotify) {
        toast.error(parsedError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMultiNoteProofs = async (notes: ShieldedNote[]) => {
    setLoading(true);
    updateStep(0, "active");
    
    try {
      for (const note of notes) {
        if (!verifyNoteCommitment(note)) {
          toast.error("Invalid note commitment detected.");
          updateStep(0, "error");
          setLoading(false);
          return;
        }
      }

      const merkleRoot = await service.getMerkleRoot();
      
      const proofs = [];
      for (let i = 0; i < notes.length; i++) {
        const proof = await generateWithdrawalProof(notes[i], merkleRoot, recipient);
        proofs.push(proof);
      }

      const totalAmount = notes.reduce((sum, note) => sum + note.amount, 0n);
      toast.success(
        `✓ Generated ${notes.length} proofs for ${formatBalance(totalAmount)} STRK!`,
        { duration: 5000 }
      );
      
      updateStep(0, "completed");
      setProofGenerated(true);
      setSelectedNotes(notes);
      setMultiNoteProofs(proofs);
    } catch (error: any) {
      updateStep(0, "error");
      const parsedError = parseError(error);
      if (parsedError.shouldLog) {
        console.error("Multi-proof generation error:", error);
      }
      if (parsedError.shouldNotify) {
        toast.error(parsedError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!service || !isConnected || !account || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!proofGenerated) {
      toast.error("Please generate proof first");
      return;
    }

    if (useMultiNote) {
      await executeMultiNoteWithdrawal();
    } else {
      await executeSingleNoteWithdrawal();
    }
  };

  const executeSingleNoteWithdrawal = async () => {
    if (!generatedProof || !selectedNote) {
      toast.error("Proof data missing");
      return;
    }

    setLoading(true);
    updateStep(1, "active");
    
    try {
      const isSpent = await service.isNullifierSpent(generatedProof.nullifierHash);
      
      if (isSpent) {
        toast.error("This note has already been spent!");
        updateStep(1, "error");
        setLoading(false);
        return;
      }

      const withdrawResult = await safeWalletOperation(
        async () => {
          return await service.withdraw({
            proof: generatedProof.proof,
            publicInputs: generatedProof.publicInputs,
            recipient,
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

      if (!withdrawResult.success) {
        updateStep(1, "error");
        setLoading(false);
        return;
      }

      const tx = withdrawResult.data!;
      updateStep(1, "completed");
      toast.success(`Withdrawal submitted! TX: ${tx.transaction_hash.slice(0, 10)}...`);
      
      if (keypair?.zkAddress) {
        markNoteAsSpent(keypair.zkAddress, selectedNote.commitment);
        window.dispatchEvent(new CustomEvent('shieldedBalanceChanged'));
      }

      updateStep(2, "active");
      account.waitForTransaction(tx.transaction_hash, {
        retryInterval: 5000,
      }).then(() => {
        updateStep(2, "completed");
        toast.success("Withdrawal confirmed!");
      }).catch((err) => {
        updateStep(2, "error");
        console.error("TX confirmation error:", err);
      });

      setTimeout(() => resetModal(), 1000);
    } catch (error: any) {
      updateStep(1, "error");
      const parsedError = parseError(error);
      if (parsedError.shouldLog) {
        console.error("Withdrawal error:", error);
      }
      if (parsedError.shouldNotify) {
        toast.error(parsedError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const executeMultiNoteWithdrawal = async () => {
    if (selectedNotes.length === 0 || multiNoteProofs.length === 0) {
      toast.error("Multi-note proof data missing");
      return;
    }

    setLoading(true);
    updateStep(1, "active");
    const successfulWithdrawals: string[] = [];

    try {
      toast.info(`Starting ${selectedNotes.length} sequential withdrawals...`, { duration: 3000 });

      for (let i = 0; i < selectedNotes.length; i++) {
        const note = selectedNotes[i];
        const proof = multiNoteProofs[i];

        try {
          const isSpent = await service.isNullifierSpent(proof.nullifierHash);
          if (isSpent) {
            toast.warning(`Note ${i + 1}/${selectedNotes.length} already spent, skipping...`);
            continue;
          }

          toast.info(`Withdrawing note ${i + 1}/${selectedNotes.length}...`);

          const withdrawResult = await safeWalletOperation(
            async () => {
              return await service.withdraw({
                proof: proof.proof,
                publicInputs: proof.publicInputs,
                recipient,
              });
            },
            {
              onError: (error) => {
                if (error.type !== ErrorType.USER_REJECTED && error.shouldNotify) {
                  toast.error(`Note ${i + 1} failed: ${error.userMessage}`);
                }
              },
            }
          );

          if (!withdrawResult.success) {
            if (withdrawResult.error?.type === ErrorType.USER_REJECTED) {
              toast.error("Withdrawal cancelled by user");
              break;
            }
            continue;
          }

          const tx = withdrawResult.data!;
          successfulWithdrawals.push(tx.transaction_hash);
          
          if (keypair?.zkAddress) {
            markNoteAsSpent(keypair.zkAddress, note.commitment);
          }
          
          toast.success(`Note ${i + 1}/${selectedNotes.length} withdrawn!`);

          if (i < selectedNotes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error: any) {
          console.error(`Note ${i + 1} withdrawal error:`, error);
          const parsedError = parseError(error);
          if (parsedError.type === ErrorType.USER_REJECTED) {
            toast.error("Withdrawal cancelled");
            break;
          }
        }
      }

      window.dispatchEvent(new CustomEvent('shieldedBalanceChanged'));
      
      if (successfulWithdrawals.length === selectedNotes.length) {
        updateStep(1, "completed");
        updateStep(2, "completed");
        toast.success(`🎉 All ${selectedNotes.length} withdrawals completed!`, { duration: 5000 });
      } else if (successfulWithdrawals.length > 0) {
        updateStep(1, "completed");
        toast.warning(
          `Completed ${successfulWithdrawals.length}/${selectedNotes.length} withdrawals.`,
          { duration: 6000 }
        );
      } else {
        updateStep(1, "error");
        toast.error("All withdrawals failed");
      }

      if (successfulWithdrawals.length > 0) {
        setTimeout(() => resetModal(), 1000);
      }
    } catch (error: any) {
      updateStep(1, "error");
      const parsedError = parseError(error);
      if (parsedError.shouldLog) {
        console.error("Multi-withdrawal error:", error);
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
    setAmount("");
    setRecipient("");
    setProofGenerated(false);
    setGeneratedProof(null);
    setSelectedNote(null);
    setUseMultiNote(false);
    setSelectedNotes([]);
    setMultiNoteProofs([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md bg-gray-900/95 backdrop-blur-xl border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Withdraw from Pool
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Unshield your funds to a public address
          </DialogDescription>
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
              disabled={availableNotes.length === 0}
            />
            
            {/* Quick Select */}
            {availableNotes.length > 0 && (
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
                  <p className="text-xs text-blue-300">
                    Multi-note: Auto combines notes if needed (multiple txs, higher gas)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recipient Input */}
          <div>
            <Label className="text-sm">Recipient Public Address</Label>
            <Input
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="mt-2 bg-white/5 border-white/10 font-mono text-sm"
            />
          </div>

          {/* Multi-Note Info */}
          {proofGenerated && useMultiNote && selectedNotes.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm font-semibold text-amber-300 mb-1">
                Multi-Note: {selectedNotes.length} transactions
              </p>
              <p className="text-xs text-amber-200/80">
                This will execute {selectedNotes.length} separate withdrawals (higher gas cost)
              </p>
            </div>
          )}

          {/* Status Stepper */}
          {(loading || proofGenerated) && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-semibold mb-3 text-gray-300">Withdrawal Progress</p>
              <TransactionStatusStepper steps={steps} />
            </div>
          )}

          {/* Privacy Notice */}
          {!loading && !proofGenerated && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-xs text-purple-300">
                ⚠️ Withdrawing will unshield funds. On-chain observers will see recipient & amount, but not which note was spent.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <GlowButton 
              variant="secondary" 
              className="w-full" 
              disabled={!amount || !recipient || loading || availableNotes.length === 0 || proofGenerated} 
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
                "Generate Withdrawal Proof"
              )}
            </GlowButton>
            
            <GlowButton 
              className="w-full" 
              disabled={!proofGenerated || loading} 
              onClick={handleWithdraw}
            >
              {loading && proofGenerated ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{useMultiNote ? `Executing ${selectedNotes.length} Withdrawals...` : 'Submitting...'}</span>
                </>
              ) : (
                `Execute Withdrawal${useMultiNote ? ` (${selectedNotes.length} notes)` : ''}`
              )}
            </GlowButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
