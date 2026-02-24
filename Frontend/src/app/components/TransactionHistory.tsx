import { useEffect, useState } from "react";
import { useZkKeypair } from "../../contexts/ZkKeypairContext";
import { getNotes, type ShieldedNote } from "../../utils/noteStorage";
import { TOKENS } from "../../contracts/config";
import { History, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function TransactionHistory() {
  const { keypair } = useZkKeypair();
  const [notes, setNotes] = useState<ShieldedNote[]>([]);

  const refreshHistory = () => {
    if (keypair?.zkAddress) {
      const userNotes = getNotes(keypair.zkAddress);
      // Sort by timestamp (newest first), handle missing timestamps
      const sorted = userNotes.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
      });
      setNotes(sorted);
    }
  };

  useEffect(() => {
    refreshHistory();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(refreshHistory, 5000);
    
    // Listen for balance change events
    const handleBalanceChange = () => {
      console.log("📜 Transaction history: Balance changed, refreshing...");
      refreshHistory();
    };
    
    window.addEventListener("shieldedBalanceChanged", handleBalanceChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("shieldedBalanceChanged", handleBalanceChange);
    };
  }, [keypair?.zkAddress]);

  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 10 ** TOKENS.STRK.decimals).toFixed(4);
  };

  const getExplorerUrl = (txHash: string) => {
    return `https://sepolia.voyager.online/tx/${txHash}`;
  };

  if (!keypair?.zkAddress) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <History className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-2 sm:mb-3" />
        <p className="text-sm sm:text-base text-gray-400">Connect wallet to view transaction history</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <History className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-2 sm:mb-3" />
        <p className="text-sm sm:text-base text-gray-400">No shielded transactions yet</p>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">Make a deposit to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {notes.map((note, index) => (
        <div
          key={`${note.transactionHash}-${index}`}
          className="p-3 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
        >
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            {/* Icon & Type */}
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                note.type === "deposit" 
                  ? "bg-green-500/20 text-green-400"
                  : note.type === "received"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-violet-500/20 text-violet-400"
              }`}>
                {note.type === "deposit" ? (
                  <ArrowDownToLine className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : note.type === "received" ? (
                  <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <ArrowUpFromLine className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-white capitalize">
                    {note.type === "received" ? "Received Transfer" : note.type}
                  </p>
                  {note.isSpent && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                      Spent
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-400 mb-2">
                  {note.timestamp && !isNaN(note.timestamp) && note.timestamp > 0
                    ? formatDistanceToNow(new Date(note.timestamp), { addSuffix: true })
                    : "Recently"
                  }
                </p>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Commitment:</span>
                    <code className="text-xs text-violet-400 font-mono truncate max-w-[200px]">
                      {note.commitment.slice(0, 20)}...
                    </code>
                  </div>
                  {note.leafIndex && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Leaf Index:</span>
                      <code className="text-xs text-blue-400 font-mono">
                        {note.leafIndex}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Amount & Actions */}
            <div className="text-right flex flex-col items-end gap-2">
              <div>
                <p className={`text-lg font-semibold ${
                  note.type === "deposit" || note.type === "received"
                    ? "text-green-400"
                    : "text-red-400"
                }`}>
                  {note.type === "deposit" || note.type === "received" ? "+" : "-"}
                  {formatAmount(note.amount)} STRK
                </p>
                <p className="text-xs text-gray-500">
                  ${(parseFloat(formatAmount(note.amount)) * 1.5).toFixed(2)} USD
                </p>
              </div>

              <a
                href={getExplorerUrl(note.transactionHash || "")}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-opacity ${
                  note.transactionHash ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                View on Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}