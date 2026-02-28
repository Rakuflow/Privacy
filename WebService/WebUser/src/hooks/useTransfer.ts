import { useState, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';
import { toast } from 'sonner';
import { hash } from 'starknet';
import type { GeneratedTransferProof } from '../types/Proof.type';
import type { ShieldedNote } from '../types/NoteStorage.type';
import type { Step } from '../types/TransactionStatus.type';
import { safeWalletOperation, parseError, ErrorType } from '../utils/errorHandling';
import { TOKENS } from '../contracts/config';
import { getUnspentNotesAsync, markNoteAsSpent, saveNote } from '../utils/noteStorage';
import { saveHistory } from '../utils/historyStorage';
import { computeNullifierHash, resolveNoteSpendingKey } from '../utils/zkProofGenerator';
import { generateRho, generateRcm } from '../utils/zkKeypair';
import { useShieldedPool } from './useShieldedPool';
import { relayerService } from '../services/RelayerService';
import { useZkKeypair } from '../contexts/ZkKeypairContext';

export function useTransfer(open: boolean, zkAddress: string) {
  const [recipientZk, setRecipientZk] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [generatedProof, setGeneratedProof] = useState<GeneratedTransferProof | null>(null);
  const [selectedNote, setSelectedNote] = useState<ShieldedNote | null>(null);
  const [availableNotes, setAvailableNotes] = useState<ShieldedNote[]>([]);
  const [shieldedBalance, setShieldedBalance] = useState<bigint>(0n);
  const [useRelayer, setUseRelayer] = useState(false);
  const [relayerAvailable, setRelayerAvailable] = useState(false);
  const [steps, setSteps] = useState<Step[]>([
    { label: 'Proof', status: 'pending' },
    { label: 'Submit', status: 'pending' },
    { label: 'Success', status: 'pending' },
  ]);

  const { service, isConnected } = useShieldedPool();
  const { account, address } = useAccount();
  const { keypair } = useZkKeypair();

  // Check relayer availability on mount
  useEffect(() => {
    relayerService
      .isAvailable()
      .then((available) => {
        setRelayerAvailable(available);
      })
      .catch(() => {
        setRelayerAvailable(false);
      });
  }, []);

  useEffect(() => {
    if (open && zkAddress) {
      // Load notes asynchronously
      getUnspentNotesAsync(zkAddress).then((notes) => {
        setAvailableNotes(notes);
        const balance = notes.reduce((sum, note) => sum + note.amount, 0n);
        setShieldedBalance(balance);
      });
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

    if (!keypair?.spendingKey) {
      toast.error('Missing zk spending key. Please setup your zk-keypair.');
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

    if (!exactMatch.rho || !exactMatch.rcm) {
      toast.error('Invalid note data. Please re-deposit funds.');
      return;
    }

    setLoading(true);
    updateStep(0, 'active');

    try {
      const merkleRoot = await service.getMerkleRoot();
      const leafIndex = parseInt(exactMatch.leafIndex || '0');
      const noteSpendingKey = resolveNoteSpendingKey(exactMatch, keypair.spendingKey, zkAddress);
      const nullifierHash = computeNullifierHash(noteSpendingKey, exactMatch.rho, leafIndex);

      const recipientZkFelt = '0x' + recipientZk.slice(3);
      const newRho = generateRho();
      const newRcm = generateRcm();

      const newCommitment = hash.computePoseidonHashOnElements([amountWei.toString(), newRho, newRcm, recipientZkFelt]);

      // Public inputs for mock verifier.
      const transferGasFeeWei = 0n;
      const publicInputs = [
        merkleRoot,
        nullifierHash,
        newCommitment,
        '0x' + transferGasFeeWei.toString(16), // Gas fee (public)
      ];

      const proof = ['0x1', '0x2', '0x3'];

      const noteForRecipient = {
        amount: amountWei,
        rho: newRho,
        rcm: newRcm,
        commitment: newCommitment,
      };

      setGeneratedProof({
        proof,
        publicInputs,
        nullifierHash,
        noteForRecipient,
        generatedBy: address, // Save the wallet address that generated the proof
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
    // Use relayer if enabled
    if (useRelayer && relayerAvailable) {
      return handleTransferViaRelayer();
    }

    // Otherwise use direct wallet submission
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

      await Promise.all([
        markNoteAsSpent(zkAddress, selectedNote.commitment),
        saveHistory(zkAddress, {
          type: 'transfer',
          transactionHash: tx.transaction_hash,
          timestamp: Date.now(),
          amount: selectedNote.amount,
          recipientZkAddress: recipientZk,
        }),
        saveNote(recipientZk, {
          amount: generatedProof.noteForRecipient.amount,
          rho: generatedProof.noteForRecipient.rho,
          rcm: generatedProof.noteForRecipient.rcm,
          commitment: generatedProof.noteForRecipient.commitment,
          isSpent: false,
        }),
        saveHistory(recipientZk, {
          type: 'received',
          transactionHash: tx.transaction_hash,
          timestamp: Date.now(),
          amount: generatedProof.noteForRecipient.amount,
        }),
      ]);

      window.dispatchEvent(new CustomEvent('shieldedBalanceChanged'));

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

  const handleTransferViaRelayer = async () => {
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
      // Check nullifier not spent
      const isSpent = await service.isNullifierSpent(generatedProof.nullifierHash);

      if (isSpent) {
        toast.error('This note has already been spent!');
        updateStep(1, 'error');
        setLoading(false);
        return;
      }

      // NEW FLOW: Estimate fee → sign intent → relay
      toast.info('🎭 Estimating relayer fee...');

      const { feeEstimate, relay } = await relayerService.relayWithFeeEstimate(
        account,
        'transfer',
        generatedProof.proof,
        generatedProof.publicInputs,
        'STRK' // Default to STRK for fees
      );

      if (!feeEstimate.success) {
        throw new Error('Fee estimation failed');
      }

      // Show fee to user (in production, add confirmation dialog)
      const feeInStrk = (BigInt(feeEstimate.totalFee) / BigInt(1e18)).toString();
      toast.info(`💰 Relayer fee: ${feeInStrk} STRK (gas + service fee)`, { duration: 5000 });

      // Execute relay (relayer pays gas, collects fee)
      toast.info('🚀 Submitting via relayer (relayer pays gas)...');

      const relayResponse = await relay();
      if (!relayResponse.success || !relayResponse.data) {
        throw new Error(relayResponse.error || 'Relayer submission failed');
      }
      const relayResult = relayResponse.data;
      if (!relayResult.success || !relayResult.transactionHash) {
        throw new Error(relayResult.error || 'Relayer returned invalid transaction data');
      }
      const relayedTxHash = relayResult.transactionHash;

      updateStep(1, 'completed');
      toast.success(`Transfer relayed! TX: ${relayedTxHash.slice(0, 10)}...`, { duration: 5000 });
      toast.info(`🎭 Anonymous! Explorer shows relayer address, not yours!`, { duration: 7000 });
      toast.success(`💳 Fee paid: ${feeInStrk} STRK`, { duration: 5000 });

      await Promise.all([
        markNoteAsSpent(zkAddress, selectedNote.commitment),
        saveHistory(zkAddress, {
          type: 'transfer',
          transactionHash: relayedTxHash,
          timestamp: Date.now(),
          amount: selectedNote.amount,
          recipientZkAddress: recipientZk,
        }),
        saveNote(recipientZk, {
          amount: generatedProof.noteForRecipient.amount,
          rho: generatedProof.noteForRecipient.rho,
          rcm: generatedProof.noteForRecipient.rcm,
          commitment: generatedProof.noteForRecipient.commitment,
          isSpent: false,
        }),
        saveHistory(recipientZk, {
          type: 'received',
          transactionHash: relayedTxHash,
          timestamp: Date.now(),
          amount: generatedProof.noteForRecipient.amount,
        }),
      ]);

      window.dispatchEvent(new CustomEvent('shieldedBalanceChanged'));

      // Wait for confirmation (no need for wallet since relayer submitted)
      updateStep(2, 'active');

      // Poll for transaction confirmation
      const pollInterval = setInterval(async () => {
        try {
          const receipt = await service.provider.getTransactionReceipt(relayedTxHash);

          if (receipt && receipt.execution_status === 'SUCCEEDED') {
            clearInterval(pollInterval);
            updateStep(2, 'completed');
            toast.success('Shielded transfer confirmed!');
            window.dispatchEvent(new CustomEvent('shieldedBalanceChanged'));
          } else if (receipt && receipt.execution_status === 'REVERTED') {
            clearInterval(pollInterval);
            updateStep(2, 'error');
            toast.error('Transaction reverted');
          }
        } catch (err) {
          // Still pending, continue polling
        }
      }, 5000);

      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000);
    } catch (error: any) {
      updateStep(1, 'error');
      console.error('Relayer transfer error:', error);
      toast.error(error.message || 'Failed to relay transaction');
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
    generatedProof,
    steps,
    useRelayer,
    setUseRelayer,
    relayerAvailable,
    formatBalance,
    handleGenerateProof,
    handleTransfer,
    resetForm,
    isCompleted: steps[2].status === 'completed',
  };
}
