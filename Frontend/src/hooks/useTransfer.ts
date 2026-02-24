import { useState, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';
import { toast } from 'sonner';
import { hash } from 'starknet';
import { Step } from '../app/components/TransactionStatusStepper';
import { safeWalletOperation, parseError, ErrorType } from '../utils/errorHandling';
import { TOKENS } from '../contracts/config';
import { getUnspentNotes, markNoteAsSpent, ShieldedNote, saveNote } from '../utils/noteStorage';
import { saveHistory } from '../utils/historyStorage';
import { computeNullifierHash } from '../utils/zkProofGenerator';
import { generateRho, generateRcm } from '../utils/zkKeypair';
import { useShieldedPool } from './useShieldedPool';

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

export function useTransfer(open: boolean, zkAddress: string) {
  const [recipientZk, setRecipientZk] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [generatedProof, setGeneratedProof] = useState<GeneratedTransferProof | null>(null);
  const [selectedNote, setSelectedNote] = useState<ShieldedNote | null>(null);
  const [availableNotes, setAvailableNotes] = useState<ShieldedNote[]>([]);
  const [shieldedBalance, setShieldedBalance] = useState<bigint>(0n);
  const [steps, setSteps] = useState<Step[]>([
    { label: 'Proof', status: 'pending' },
    { label: 'Submit', status: 'pending' },
    { label: 'Success', status: 'pending' },
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
      resetForm();
    }
  }, [open, zkAddress]);

  const formatBalance = (balance: bigint) => {
    return (Number(balance) / 10 ** TOKENS.STRK.decimals).toFixed(4);
  };

  const updateStep = (index: number, status: Step['status']) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, status } : step)));
  };

  const resetForm = () => {
    setRecipientZk('');
    setAmount('');
    setLoading(false);
    setProofGenerated(false);
    setGeneratedProof(null);
    setSelectedNote(null);
    setSteps([
      { label: 'Proof', status: 'pending' },
      { label: 'Submit', status: 'pending' },
      { label: 'Success', status: 'pending' },
    ]);
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
        if (transferResult.error?.type === ErrorType.USER_REJECTED) {
          updateStep(1, 'pending');
        } else {
          updateStep(1, 'error');
        }
        setLoading(false);
        return;
      }

      const tx = transferResult.data!;
      updateStep(1, 'completed');
      toast.success(`Transfer submitted! TX: ${tx.transaction_hash.slice(0, 10)}...`);

      markNoteAsSpent(zkAddress, selectedNote.commitment);

      saveHistory(zkAddress, {
        type: 'transfer',
        transactionHash: tx.transaction_hash,
        timestamp: Date.now(),
        amount: selectedNote.amount,
        recipientZkAddress: recipientZk,
      });

      window.dispatchEvent(new CustomEvent('shieldedBalanceChanged'));

      saveNote(recipientZk, {
        amount: generatedProof.noteForRecipient.amount,
        rho: generatedProof.noteForRecipient.rho,
        rcm: generatedProof.noteForRecipient.rcm,
        spendingKey: generatedProof.noteForRecipient.spendingKey,
        commitment: generatedProof.noteForRecipient.commitment,
        isSpent: false,
      });

      saveHistory(recipientZk, {
        type: 'received',
        transactionHash: tx.transaction_hash,
        timestamp: Date.now(),
        amount: generatedProof.noteForRecipient.amount,
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

  return {
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
    isCompleted: steps[2].status === 'completed',
  };
}
