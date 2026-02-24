import { useConnect } from "@starknet-react/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { safeWalletOperation, parseError, ErrorType } from "../../utils/errorHandling";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const { connect, connectors } = useConnect();
  const [connecting, setConnecting] = useState<string | null>(null);

  // Debug: log connector info (not the full object to avoid circular refs)
  console.log("Available connectors:", connectors.length, connectors.map(c => ({ id: c.id, name: c.name })));

  const handleConnect = async (connector: any) => {
    setConnecting(connector.id);
    console.log("Attempting to connect to:", connector.id, connector.name);
    
    const result = await safeWalletOperation(
      async () => {
        return await connect({ connector });
      },
      {
        onSuccess: () => {
          toast.success(`Connected to ${connector.name || connector.id}`);
          onOpenChange(false);
        },
        onError: (error) => {
          // Don't show toast for user rejection (they cancelled)
          if (error.type !== ErrorType.USER_REJECTED && error.shouldNotify) {
            toast.error(error.userMessage);
          }
        },
      }
    );
    
    setConnecting(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/20 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose a wallet to connect to Starknet
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {connectors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No wallet connectors found</p>
              <p className="text-sm text-gray-500">
                Please install{" "}
                <a 
                  href="https://www.ready.co/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  Argent X
                </a>
                {" or "}
                <a 
                  href="https://braavos.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Braavos
                </a>
                {" "}wallet extension
              </p>
            </div>
          ) : (
            connectors.map((connector) => {
              const isArgent = connector.id === "argentX";
              const isBraavos = connector.id === "braavos";
              const isConnecting = connecting === connector.id;
              
              return (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  disabled={isConnecting}
                  className="w-full group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-purple-500/50 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        isArgent 
                          ? "bg-orange-500/20 text-orange-400" 
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-white">
                          {isArgent ? "Argent X" : isBraavos ? "Braavos" : connector.name || connector.id}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {isArgent 
                            ? "Most popular Starknet wallet" 
                            : "Advanced Starknet wallet"}
                        </p>
                      </div>
                    </div>
                    {isConnecting && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    )}
                  </div>
                  
                  {/* Glow effect on hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10 ${
                    isArgent ? "bg-orange-500/20" : "bg-blue-500/20"
                  }`}></div>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          Don't have a wallet?{" "}
          <a 
            href="https://www.argent.xyz/argent-x/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Get Argent X
          </a>
          {" or "}
          <a 
            href="https://braavos.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Get Braavos
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}