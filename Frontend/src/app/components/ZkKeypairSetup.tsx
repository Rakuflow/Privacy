import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { GlowButton } from "./GlowButton";
import { toast } from "sonner";
import { Key, Copy, Check, AlertTriangle, Shield, Loader2 } from "lucide-react";
import { getTypedDataForSigning, deriveZkKeypair } from "../../utils/zkKeypair";
import { useZkKeypair } from "../../contexts/ZkKeypairContext";
import { copyToClipboard as copyText } from "../../utils/clipboard";
import { constants } from "starknet";
import { safeWalletOperation, parseError, ErrorType } from "../../utils/errorHandling";

interface ZkKeypairSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeypairCreated?: () => void;
}

export function ZkKeypairSetup({ open, onOpenChange, onKeypairCreated }: ZkKeypairSetupProps) {
  const { account, address } = useAccount();
  const { setKeypair } = useZkKeypair();
  const [loading, setLoading] = useState(false);
  const [zkAddress, setZkAddress] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerateKeypair = async () => {
    if (!account || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      // Get chain ID (Starknet Sepolia)
      const chainId = constants.StarknetChainId.SN_SEPOLIA;

      // Step 1: Get typed data for user to sign
      const typedDataToSign = getTypedDataForSigning(chainId);
      
      console.log("Requesting signature for typed data:", typedDataToSign);
      
      toast.info("Please sign the message in your wallet...");

      // Step 2: Request user signature with error handling
      const signatureResult = await safeWalletOperation(
        async () => {
          return await account.signMessage(typedDataToSign);
        },
        {
          onError: (error) => {
            // Silent handling for user rejection
            if (error.type === ErrorType.USER_REJECTED) {
              // Don't show error toast
              return;
            }
            if (error.shouldNotify) {
              toast.error(error.userMessage);
            }
          },
        }
      );

      if (!signatureResult.success) {
        setLoading(false);
        return;
      }

      const signature = signatureResult.data!;
      
      console.log("✓ Signature received:", signature);

      // Step 3: Derive zk-keypair from signature
      toast.info("Deriving your shielded keys...");
      
      const keypair = deriveZkKeypair(signature, chainId, address);
      
      // Step 4: Store in memory (Context) with wallet address binding
      const keypairWithAddress = {
        ...keypair,
        walletAddress: address, // Bind to current wallet
      };
      setKeypair(keypairWithAddress);
      setZkAddress(keypair.zkAddress);
      setGenerated(true);

      toast.success("zk-Keypair generated successfully!");
      console.log("✓ zk-Keypair stored in memory (not localStorage)");

      if (onKeypairCreated) {
        onKeypairCreated();
      }
    } catch (error: any) {
      const parsedError = parseError(error);
      
      if (parsedError.shouldLog) {
        console.error("Failed to generate zk-keypair:", error);
      }
      
      if (parsedError.shouldNotify) {
        toast.error(parsedError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await copyText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state when closing
    setTimeout(() => {
      setGenerated(false);
      setZkAddress("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl bg-gray-900/95 backdrop-blur-xl border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-400" />
            Setup Shielded Keys
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Generate your zero-knowledge keypair for private transactions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {!generated ? (
            <>
              {/* How it works */}
              <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-violet-300 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  How it works
                </p>
                <ul className="text-xs text-gray-300 space-y-2 ml-6 list-disc">
                  <li>You'll sign a message with your wallet (no gas required)</li>
                  <li>Your signature is used to derive your shielded spending key</li>
                  <li>The key is deterministic - same wallet → same zk-address</li>
                  <li>Your spending key is <strong className="text-violet-300">securely stored</strong> in your browser (encoded)</li>
                  <li>When you reload, your zk-address is automatically restored</li>
                </ul>
              </div>

              {/* Security Notice */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-300 mb-1">Security Notice</p>
                  <p className="text-xs text-amber-200/80">
                    Your spending key is stored encoded in your browser for convenience. 
                    Your wallet signature can always re-derive the same key. 
                    For maximum security, you can clear stored keys from your browser anytime.
                  </p>
                </div>
              </div>

              {/* Generate Button */}
              <GlowButton
                className="w-full"
                onClick={handleGenerateKeypair}
                disabled={loading || !account}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing Message...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Generate zk-Keypair</span>
                  </>
                )}
              </GlowButton>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <p className="text-sm font-semibold text-green-300">Keys Generated Successfully!</p>
                </div>
                <p className="text-xs text-green-200/80">
                  Your shielded keypair is ready. You can now deposit, transfer, and withdraw privately.
                </p>
              </div>

              {/* zk-Address Display */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-violet-400" />
                    <p className="text-sm text-gray-400">Your Shielded Address</p>
                    <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">0zk...</span>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-500/30 rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-sm text-violet-300 break-all flex-1">
                        {zkAddress}
                      </p>
                      <button
                        onClick={() => copyToClipboard(zkAddress)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-violet-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-200/80">
                    💡 <strong>Share this 0zk... address</strong> with others to receive private transfers. 
                    This is your shielded account, separate from your public wallet (0x...).
                  </p>
                </div>
              </div>

              {/* Technical Details */}
              <details className="group">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-violet-300 transition-colors">
                  🔍 Technical Details (Advanced)
                </summary>
                <div className="mt-3 p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-gray-500">zk_address:</span>
                    <p className="text-violet-300 break-all">{zkAddress}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-gray-400 mb-1">Derivation:</p>
                    <ol className="text-gray-500 space-y-1 list-decimal ml-4">
                      <li>entropy = Poseidon(signature.r, signature.s)</li>
                      <li>zk_spend_sk = Poseidon(entropy, walletAddr, chainId, contractAddr)</li>
                      <li>zk_spend_pk = Pedersen(zk_spend_sk)</li>
                      <li>zk_address = Poseidon(zk_spend_pk)</li>
                    </ol>
                  </div>
                </div>
              </details>

              {/* Continue Button */}
              <GlowButton className="w-full" onClick={handleClose}>
                Continue to App
              </GlowButton>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}