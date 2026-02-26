import { useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { toast } from "sonner";
import { Step } from "../app/components/TransactionStatusStepper";
import {
  safeWalletOperation,
  parseError,
  ErrorType,
} from "../utils/errorHandling";
import { TOKENS } from "../contracts/config";
import {
  getUnspentNotesAsync,
  markNoteAsSpent,
  ShieldedNote,
} from "../utils/noteStorage";
import { saveHistory } from "../utils/historyStorage";
import {
  generateWithdrawalProof,
  verifyNoteCommitment,
  resolveNoteSpendingKey,
} from "../utils/zkProofGenerator";
import { useShieldedPool } from "./useShieldedPool";
import { useZkKeypair } from "../contexts/ZkKeypairContext";

export function useWithdraw(open: boolean) {
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
  const [useRelayer, setUseRelayer] = useState(false);
  const [proofGeneratedBy, setProofGeneratedBy] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([
    { label: "Proof", status: "pending" },
    { label: "Submit", status: "pending" },
    { label: "Success", status: "pending" },
  ]);

  const { service, isConnected } = useShieldedPool();
  const { account, address } = useAccount();
  const { keypair } = useZkKeypair();

  useEffect(() => {
    if (open && keypair?.zkAddress) {
      // Load notes asynchronously
      getUnspentNotesAsync(keypair.zkAddress).then(notes => {
        setAvailableNotes(notes);
        const balance = notes.reduce((sum, note) => sum + note.amount, 0n);
        setShieldedBalance(balance);
      });

      if (!recipient && address) {
        setRecipient(address);
      }
    }
    if (!open) {
      resetForm();
    }
  }, [open, keypair?.zkAddress, address]);

  const formatBalance = (balance: bigint) => {
    return (Number(balance) / 10 ** TOKENS.STRK.decimals).toFixed(4);
  };

  const updateStep = (index: number, status: Step["status"]) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );
  };

  const resetForm = () => {
    setAmount("");
    setRecipient("");
    setLoading(false);
    setProofGenerated(false);
    setGeneratedProof(null);
    setSelectedNote(null);
    setUseMultiNote(false);
    setSelectedNotes([]);
    setMultiNoteProofs([]);
    setUseRelayer(false);
    setProofGeneratedBy(null);
    setSteps([
      { label: "Proof", status: "pending" },
      { label: "Submit", status: "pending" },
      { label: "Success", status: "pending" },
    ]);
  };

  const findNotesCombination = (targetAmount: bigint): ShieldedNote[] | null => {
    const sorted = [...availableNotes].sort((a, b) =>
      Number(a.amount - b.amount)
    );

    const findCombination = (
      remaining: bigint,
      startIdx: number,
      current: ShieldedNote[]
    ): ShieldedNote[] | null => {
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

  const generateSingleNoteProof = async (noteToSpend: ShieldedNote) => {
    setLoading(true);
    updateStep(0, "active");

    try {
      if (!keypair?.spendingKey || !keypair?.zkAddress) {
        toast.error("Missing zk spending key. Please setup your zk-keypair.");
        updateStep(0, "error");
        setLoading(false);
        return;
      }

      const noteSpendingKey = resolveNoteSpendingKey(
        noteToSpend,
        keypair.spendingKey,
        keypair.zkAddress
      );

      if (!verifyNoteCommitment({ ...noteToSpend, spendingKey: noteSpendingKey })) {
        toast.error("Invalid note commitment.");
        updateStep(0, "error");
        setLoading(false);
        return;
      }

      const merkleRoot = await service.getMerkleRoot();
      const proof = await generateWithdrawalProof(
        noteToSpend,
        merkleRoot,
        recipient,
        noteSpendingKey
      );

      toast.success("Withdrawal proof generated!");
      updateStep(0, "completed");
      setProofGenerated(true);
      setGeneratedProof(proof);
      setSelectedNote(noteToSpend);
      setProofGeneratedBy("user");
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
      if (!keypair?.spendingKey || !keypair?.zkAddress) {
        toast.error("Missing zk spending key. Please setup your zk-keypair.");
        updateStep(0, "error");
        setLoading(false);
        return;
      }

      for (const note of notes) {
        const noteSpendingKey = resolveNoteSpendingKey(
          note,
          keypair.spendingKey,
          keypair.zkAddress
        );

        if (!verifyNoteCommitment({ ...note, spendingKey: noteSpendingKey })) {
          toast.error("Invalid note commitment detected.");
          updateStep(0, "error");
          setLoading(false);
          return;
        }
      }

      const merkleRoot = await service.getMerkleRoot();

      const proofs = [];
      for (let i = 0; i < notes.length; i++) {
        const noteSpendingKey = resolveNoteSpendingKey(
          notes[i],
          keypair.spendingKey,
          keypair.zkAddress
        );
        const proof = await generateWithdrawalProof(
          notes[i],
          merkleRoot,
          recipient,
          noteSpendingKey
        );
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
      setProofGeneratedBy("user");
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

  const handleGenerateProof = async () => {
    if (!service || !isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amount || !recipient) {
      toast.error("Please fill in all fields");
      return;
    }

    const amountWei = BigInt(
      Math.floor(parseFloat(amount) * 10 ** TOKENS.STRK.decimals)
    );

    if (amountWei > shieldedBalance) {
      toast.error("Insufficient shielded balance");
      return;
    }

    const exactMatch = availableNotes.find((note) => note.amount === amountWei);

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

  const executeSingleNoteWithdrawal = async () => {
    if (!generatedProof || !selectedNote) {
      toast.error("Proof data missing");
      return;
    }

    setLoading(true);
    updateStep(1, "active");

    try {
      const isSpent = await service.isNullifierSpent(
        generatedProof.nullifierHash
      );

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
        if (withdrawResult.error?.type === ErrorType.USER_REJECTED) {
          updateStep(1, "pending");
        } else {
          updateStep(1, "error");
        }
        setLoading(false);
        return;
      }

      const tx = withdrawResult.data!;
      updateStep(1, "completed");
      toast.success(`Withdrawal submitted! TX: ${tx.transaction_hash.slice(0, 10)}...`);

      if (keypair?.zkAddress) {
        await markNoteAsSpent(keypair.zkAddress, selectedNote.commitment);
        window.dispatchEvent(new CustomEvent("shieldedBalanceChanged"));
      }

      updateStep(2, "active");
      account
        .waitForTransaction(tx.transaction_hash, {
          retryInterval: 5000,
        })
        .then(async () => {
          updateStep(2, "completed");
          toast.success("Withdrawal confirmed!");

          if (keypair?.zkAddress) {
            await saveHistory(keypair.zkAddress, {
              type: "withdraw",
              amount: selectedNote.amount,
              transactionHash: tx.transaction_hash,
              timestamp: Date.now(),
            });
          }
        })
        .catch((err) => {
          updateStep(2, "error");
          console.error("TX confirmation error:", err);
        });
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
      toast.info(`Starting ${selectedNotes.length} sequential withdrawals...`, {
        duration: 3000,
      });

      for (let i = 0; i < selectedNotes.length; i++) {
        const note = selectedNotes[i];
        const proof = multiNoteProofs[i];

        try {
          const isSpent = await service.isNullifierSpent(proof.nullifierHash);
          if (isSpent) {
            toast.warning(
              `Note ${i + 1}/${selectedNotes.length} already spent, skipping...`
            );
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
                if (
                  error.type !== ErrorType.USER_REJECTED &&
                  error.shouldNotify
                ) {
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
            await markNoteAsSpent(keypair.zkAddress, note.commitment);
          }

          toast.success(`Note ${i + 1}/${selectedNotes.length} withdrawn!`);

          if (i < selectedNotes.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
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

      window.dispatchEvent(new CustomEvent("shieldedBalanceChanged"));

      if (successfulWithdrawals.length === selectedNotes.length) {
        updateStep(1, "completed");
        updateStep(2, "completed");
        toast.success(`🎉 All ${selectedNotes.length} withdrawals completed!`, {
          duration: 5000,
        });

        if (keypair?.zkAddress) {
          const totalAmount = selectedNotes.reduce(
            (sum, note) => sum + note.amount,
            0n
          );
          await saveHistory(keypair.zkAddress, {
            type: "withdraw",
            amount: totalAmount,
            transactionHash: successfulWithdrawals[0],
            timestamp: Date.now(),
          });
        }
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

  return {
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
    isCompleted: steps[2].status === "completed",
    useRelayer,
    setUseRelayer,
    proofGeneratedBy,
  };
}
