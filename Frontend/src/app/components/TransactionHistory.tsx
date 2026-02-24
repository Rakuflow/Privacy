import { useEffect, useState } from 'react';
import { useZkKeypair } from '../../contexts/ZkKeypairContext';
import { getHistory, type TransactionHistory as TxHistory } from '../../utils/historyStorage';
import { TOKENS } from '../../contracts/config';
import { History, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ITEMS_PER_PAGE = 10;

export function TransactionHistory() {
  const { keypair } = useZkKeypair();
  const [histories, setHistories] = useState<TxHistory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const refreshHistory = () => {
    if (keypair?.zkAddress) {
      const userHistories = getHistory(keypair.zkAddress);
      // Sort by timestamp (newest first), handle missing timestamps
      const sorted = userHistories.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
      });
      setHistories(sorted);
    }
  };

  useEffect(() => {
    refreshHistory();

    // Auto-refresh every 5 seconds
    const interval = setInterval(refreshHistory, 5000);

    // Listen for balance change events
    const handleBalanceChange = () => {
      console.log('📜 Transaction history: Balance changed, refreshing...');
      refreshHistory();
    };

    window.addEventListener('shieldedBalanceChanged', handleBalanceChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('shieldedBalanceChanged', handleBalanceChange);
    };
  }, [keypair?.zkAddress]);

  // Reset page when histories change
  useEffect(() => {
    setCurrentPage(1);
  }, [histories.length]);

  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 10 ** TOKENS.STRK.decimals).toFixed(4);
  };

  const getExplorerUrl = (txHash: string) => {
    return `https://sepolia.voyager.online/tx/${txHash}`;
  };

  // Pagination calculations
  const totalPages = Math.ceil(histories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentHistories = histories.slice(startIndex, endIndex);

  if (!keypair?.zkAddress) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <History className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-2 sm:mb-3" />
        <p className="text-sm sm:text-base text-gray-400">Connect wallet to view transaction history</p>
      </div>
    );
  }

  if (histories.length === 0) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <History className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-2 sm:mb-3" />
        <p className="text-sm sm:text-base text-gray-400">No shielded transactions yet</p>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">Make a deposit to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="space-y-2 sm:space-y-3">
        {currentHistories.map((history, index) => (
          <div key={`${history.transactionHash}-${index}`} className="p-3 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              {/* Icon & Type */}
              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    history.type === 'deposit'
                      ? 'bg-green-500/20 text-green-400'
                      : history.type === 'received'
                        ? 'bg-blue-500/20 text-blue-400'
                        : history.type === 'transfer'
                          ? 'bg-violet-500/20 text-violet-400'
                          : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {history.type === 'deposit' ? (
                    <ArrowDownToLine className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : history.type === 'received' ? (
                    <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : history.type === 'transfer' ? (
                    <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <ArrowUpFromLine className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white capitalize">{history.type === 'received' ? 'Received Transfer' : history.type}</p>
                  </div>

                  <p className="text-sm text-gray-400 mb-2">
                    {history.timestamp && !isNaN(history.timestamp) && history.timestamp > 0 ? formatDistanceToNow(new Date(history.timestamp), { addSuffix: true }) : 'Recently'}
                  </p>

                  {history.recipientZkAddress && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">To:</span>
                      <code className="text-xs text-blue-400 font-mono truncate max-w-[150px]">{history.recipientZkAddress.slice(0, 15)}...</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="text-right flex flex-col items-end gap-2">
                <div>
                  <p className={`text-lg font-semibold ${history.type === 'deposit' || history.type === 'received' ? 'text-green-400' : 'text-red-400'}`}>
                    {history.type === 'deposit' || history.type === 'received' ? '+' : '-'}
                    {formatAmount(history.amount)} STRK
                  </p>
                  <p className="text-xs text-gray-500">${(parseFloat(formatAmount(history.amount)) * 1.5).toFixed(2)} USD</p>
                </div>

                <a
                  href={getExplorerUrl(history.transactionHash || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-opacity ${
                    history.transactionHash ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 pointer-events-none'
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <p className="text-xs text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, histories.length)} of {histories.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>

            <span className="text-xs text-gray-400">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
