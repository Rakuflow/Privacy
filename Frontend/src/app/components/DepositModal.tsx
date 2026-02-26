import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { GlowButton } from "./GlowButton";
import { TransactionStatusStepper } from "./TransactionStatusStepper";
import { toast } from "sonner";
import { Loader2, AlertCircle, Coins } from "lucide-react";
import { TOKENS } from "../../contracts/config";
import { ZkKeypairSetup } from "./ZkKeypairSetup";
import { useDeposit } from "../../hooks/useDeposit";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const [showKeypairSetup, setShowKeypairSetup] = useState(false);

  const {
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
    isCompleted,
  } = useDeposit(open);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md bg-gray-900/95 backdrop-blur-xl border-white/10 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Deposit to Shielded Pool
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Shield your tokens with zero-knowledge proofs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Status Stepper */}
            {(loading || steps[2].status === "active" || isCompleted) && (
              <div className="p-2">
                <p className="text-sm font-semibold mb-3 text-gray-300">
                  Transaction Progress
                </p>
                <TransactionStatusStepper steps={steps} />
              </div>
            )}

            {/* Setup Warning */}
            {(!keypair || !isReady) && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-300 mb-1">
                    Setup Required
                  </p>
                  <button
                    onClick={() => setShowKeypairSetup(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 underline"
                  >
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
                  <span className="text-sm text-gray-400">
                    {TOKENS.STRK.symbol}
                  </span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {formattedBalance} STRK
                </span>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm">Amount</Label>
                <button
                  onClick={() =>
                    setAmount(
                      (
                        Number(balance) / 10 ** TOKENS.STRK.decimals
                      ).toString()
                    )
                  }
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  disabled={isCompleted}
                >
                  Max
                </button>
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/5 border-white/10"
                disabled={isCompleted}
              />
            </div>

            {/* Privacy Notice */}
            <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
              <p className="text-xs text-violet-300">
                🔒 Your deposit will be shielded using a zk-commitment. Only you
                will know the amount and your zk-address.
              </p>
            </div>

            <GlowButton
              className="w-full"
              disabled={
                isCompleted
                  ? false
                  : !amount ||
                    loading ||
                    !keypair ||
                    !isReady ||
                    steps[1].status === "completed" ||
                    steps[2].status === "active"
              }
              onClick={isCompleted ? resetForm : handleDeposit}
            >
              {isCompleted ? (
                <span>New Transaction</span>
              ) : loading ? (
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
          toast.success("Ready to deposit!");
        }}
      />
    </>
  );
}
