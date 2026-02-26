import { useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { toast } from "sonner";
import { Step } from "../app/components/TransactionStatusStepper";
import {
  safeWalletOperation,
  parseError,
  ErrorType,
} from "../utils/errorHandling";
import { TOKENS, CONTRACTS } from "../contracts/config";
import { saveNote } from "../utils/noteStorage";
import { saveHistory } from "../utils/historyStorage";
import { hash } from "starknet";
import { generateRho, generateRcm } from "../utils/zkKeypair";
import { useShieldedPool } from "./useShieldedPool";
import { useTokenBalance } from "./useTokenBalance";
import { useZkKeypair } from "../contexts/ZkKeypairContext";

export function useDeposit(open: boolean) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<Step[]>([
    { label: "Approve", status: "pending" },
    { label: "Submit", status: "pending" },
    { label: "Success", status: "pending" },
  ]);

  const { service, isConnected } = useShieldedPool();
  const {
    formattedBalance,
    balance,
    refetch,
    service: erc20Service,
  } = useTokenBalance();
  const { account, address } = useAccount();
  const { keypair, isReady } = useZkKeypair();

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const updateStep = (index: number, status: Step["status"]) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );
  };

  const resetForm = () => {
    setAmount("");
    setLoading(false);
    setSteps([
      { label: "Approve", status: "pending" },
      { label: "Submit", status: "pending" },
      { label: "Success", status: "pending" },
    ]);
  };

  const handleDeposit = async () => {
    if (!service || !isConnected || !account || !erc20Service || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!keypair || !isReady) {
      toast.error("Please setup your zk-keypair first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const amountWei = BigInt(
        Math.floor(parseFloat(amount) * 10 ** TOKENS.STRK.decimals)
      );

      if (amountWei > balance) {
        toast.error("Insufficient balance");
        setLoading(false);
        return;
      }

      // Step 1: Approve
      updateStep(0, "active");
      const approveResult = await safeWalletOperation(
        async () => {
          return await erc20Service.approve(
            CONTRACTS.SHIELDED_POOL,
            amountWei,
            account
          );
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
        if (approveResult.error?.type === ErrorType.USER_REJECTED) {
          updateStep(0, "pending");
        } else {
          updateStep(0, "error");
        }
        setLoading(false);
        return;
      }
      updateStep(0, "completed");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 2: Deposit
      updateStep(1, "active");
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
        if (depositResult.error?.type === ErrorType.USER_REJECTED) {
          updateStep(1, "pending");
        } else {
          updateStep(1, "error");
        }
        setLoading(false);
        return;
      }

      const depositTx = depositResult.data!;
      updateStep(1, "completed");
      toast.success(
        `Deposit submitted! TX: ${depositTx.transaction_hash.slice(0, 10)}...`
      );

      // Compute commitment and save note
      const commitment = hash.computePoseidonHashOnElements([
        amountWei.toString(),
        rho,
        rcm,
        spendingKey,
      ]);

      await Promise.all([
        saveNote(keypair.zkAddress, {
          amount: amountWei,
          rho,
          rcm,
          commitment,
          isSpent: false,
        }),
        saveHistory(keypair.zkAddress, {
          type: "deposit",
          amount: amountWei,
          transactionHash: depositTx.transaction_hash,
          timestamp: Date.now(),
        }),
      ]);

      window.dispatchEvent(new CustomEvent("shieldedBalanceChanged"));
      setTimeout(() => refetch(), 2000);

      // Step 3: Confirmation (background)
      updateStep(2, "active");
      account
        .waitForTransaction(depositTx.transaction_hash, {
          retryInterval: 5000,
        })
        .then(() => {
          updateStep(2, "completed");
          toast.success("Deposit confirmed on-chain!");
          refetch();
          window.dispatchEvent(new CustomEvent("shieldedBalanceChanged"));
        })
        .catch((err) => {
          updateStep(2, "error");
          const parsedError = parseError(err);
          if (parsedError.shouldLog) {
            console.error("Transaction confirmation error:", err);
          }
        });
    } catch (error: any) {
      const parsedError = parseError(error);
      if (parsedError.shouldLog) {
        console.error("Deposit error:", error);
      }
      if (parsedError.shouldNotify) {
        toast.error(parsedError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    amount,
    setAmount,
    loading,
    steps,
    formattedBalance,
    balance,
    keypair,
    isReady,
    handleDeposit,
    resetForm,
    isCompleted: steps[2].status === "completed",
  };
}
