/**
 * Debug panel to test zk-keypair persistence
 * Add this to AppPage to test the flow
 * 
 * Usage:
 * import { ZkKeypairDebugPanel } from './components/ZkKeypairDebugPanel';
 * <ZkKeypairDebugPanel />
 */

import { useZkKeypair } from "../../contexts/ZkKeypairContext";
import { useAccount } from "@starknet-react/core";
import { hasZkKeypair } from "../../utils/zkStorage";
import { useState, useEffect } from "react";
import { RefreshCw, Trash2, Database, CheckCircle, XCircle } from "lucide-react";

export function ZkKeypairDebugPanel() {
  const { address } = useAccount();
  const { keypair, isReady, clearKeypair } = useZkKeypair();
  const [storageStatus, setStorageStatus] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (address) {
      setStorageStatus(hasZkKeypair(address));
    } else {
      setStorageStatus(false);
    }
  }, [address, keypair, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleClearStorage = () => {
    if (confirm("Clear zk-keypair from localStorage?")) {
      clearKeypair();
      handleRefresh();
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (!address) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg p-4 text-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-violet-400">🔧 ZK-Keypair Debug</h3>
        <button
          onClick={handleRefresh}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {/* Memory Status */}
        <div className="flex items-center justify-between p-2 bg-white/5 rounded">
          <span className="text-gray-400">Memory State:</span>
          <div className="flex items-center gap-1">
            {isReady ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Loaded</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400">Empty</span>
              </>
            )}
          </div>
        </div>

        {/* Storage Status */}
        <div className="flex items-center justify-between p-2 bg-white/5 rounded">
          <span className="text-gray-400">localStorage:</span>
          <div className="flex items-center gap-1">
            {storageStatus ? (
              <>
                <Database className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400">Stored</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">Not Found</span>
              </>
            )}
          </div>
        </div>

        {/* zkAddress Display */}
        {keypair && (
          <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded">
            <p className="text-gray-400 mb-1">zk-Address:</p>
            <p className="font-mono text-violet-400 break-all">
              {keypair.zkAddress.slice(0, 20)}...{keypair.zkAddress.slice(-15)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-white/10">
          <button
            onClick={handleReload}
            className="flex-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-400 transition-colors flex items-center justify-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Reload Page
          </button>
          <button
            onClick={handleClearStorage}
            className="flex-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-400 transition-colors flex items-center justify-center gap-1"
            disabled={!storageStatus}
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>

        {/* Test Instructions */}
        <div className="pt-2 border-t border-white/10">
          <p className="text-gray-400 mb-1 font-semibold">Test Flow:</p>
          <ol className="text-gray-500 space-y-1 list-decimal list-inside">
            <li>Generate zk-keypair</li>
            <li>Check "Stored" = ✅</li>
            <li>Click "Reload Page"</li>
            <li>After reload, should auto-restore ✅</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
