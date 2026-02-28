import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Eye, EyeOff, Copy } from 'lucide-react';
import { useZkKeypair } from '../contexts/ZkKeypairContext';
import { useAccount } from '@starknet-react/core';
import { toast } from 'sonner';

export function DebugLocalStorage() {
  const [showDebug, setShowDebug] = useState(false);
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const { keypair } = useZkKeypair();
  const { address } = useAccount();

  const refreshStorageData = () => {
    const data: Record<string, any> = {};

    // Get all shielded notes
    const shieldedKeys = Object.keys(localStorage).filter((k) => k.startsWith('shieldedNotes_'));
    shieldedKeys.forEach((key) => {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || '[]');
      } catch {
        data[key] = 'Error parsing';
      }
    });

    // Get all received notes
    const receivedKeys = Object.keys(localStorage).filter((k) => k.startsWith('receivedNotes_'));
    receivedKeys.forEach((key) => {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || '[]');
      } catch {
        data[key] = 'Error parsing';
      }
    });

    // Get zk keypairs
    const zkKeys = Object.keys(localStorage).filter((k) => k.startsWith('zk_keypair_'));
    zkKeys.forEach((key) => {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        data[key] = 'Error parsing';
      }
    });

    setStorageData(data);
  };

  useEffect(() => {
    if (showDebug) {
      refreshStorageData();
      const interval = setInterval(refreshStorageData, 2000);
      return () => clearInterval(interval);
    }
  }, [showDebug]);

  if (!showDebug) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowDebug(true)} className="fixed bottom-4 right-4 bg-black/50 border-white/20 hover:bg-black/70 text-white z-50">
        <Eye className="w-4 h-4 mr-2" />
        Debug
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto bg-black/90 border border-white/20 rounded-lg p-4 z-50 text-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white">LocalStorage Debug</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={refreshStorageData} className="h-6 px-2 text-xs">
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)} className="h-6 px-2 text-xs">
            <EyeOff className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Current State */}
      <div className="mb-4 p-2 bg-blue-500/20 rounded border border-blue-500/30">
        <div className="font-semibold text-blue-300 mb-1">Current State:</div>
        <div className="text-gray-300 space-y-1">
          <div>Wallet: {address ? address.slice(0, 10) + '...' + address.slice(-6) : 'Not connected'}</div>
          {keypair && (
            <div className="flex items-center gap-2">
              <span>zkAddr: {keypair.zkAddress.slice(0, 15) + '...' + keypair.zkAddress.slice(-6)}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(keypair.zkAddress);
                  toast.success('zkAddress copied!');
                }}
                className="p-1 hover:bg-white/10 rounded"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Storage Data */}
      <div className="space-y-3">
        {Object.keys(storageData).length === 0 ? (
          <div className="text-gray-400">No data in localStorage</div>
        ) : (
          Object.entries(storageData).map(([key, value]) => (
            <div key={key} className="p-2 bg-white/5 rounded border border-white/10">
              <div className="font-semibold text-violet-300 mb-1 break-all">{key.slice(0, 25) + (key.length > 25 ? '...' : '')}</div>
              <div className="text-gray-400 max-h-32 overflow-auto">
                {Array.isArray(value) ? (
                  <div>
                    <div className="text-green-400">{value.length} note(s)</div>
                    {value.map((note: any, idx: number) => (
                      <div key={idx} className="ml-2 mt-1 text-xs">
                        #{idx + 1}: {note.amount ? `${(Number(note.amount) / 1e18).toFixed(4)} STRK` : '?'}
                        {note.commitment ? ` (${note.commitment.slice(0, 12)}...)` : ''}
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(value, null, 2).slice(0, 200)}</pre>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
