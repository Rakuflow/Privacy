import { useState } from "react";
import { Button } from "./ui/button";
import { RefreshCw, CheckCircle } from "lucide-react";
import { useZkKeypair } from "../../contexts/ZkKeypairContext";
import { syncNotesWithChain, SyncResult } from "../../utils/noteSync";
import { toast } from "sonner";

export function SyncNotesButton() {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const { keypair } = useZkKeypair();

  const handleSync = async () => {
    if (!keypair?.zkAddress) {
      toast.error("Please setup your zk-keypair first");
      return;
    }

    setSyncing(true);
    
    try {
      toast.info("🔄 Syncing notes with blockchain...");
      
      const result = await syncNotesWithChain(keypair.zkAddress, (progress) => {
        // Optional: show progress toast
        if (progress.current === 0 || progress.current === 100) {
          toast.info(progress.message);
        }
      });

      setLastSyncResult(result);
      
      // Dispatch event to refresh balance display everywhere
      window.dispatchEvent(new CustomEvent('shieldedBalanceChanged'));

      if (result.syncedNotes > 0) {
        toast.success(
          `✅ Synced ${result.syncedNotes} note(s)! Balance updated.`,
          { duration: 4000 }
        );
      } else if (result.unconfirmedNotes > 0) {
        toast.warning(
          `⏳ ${result.unconfirmedNotes} note(s) pending confirmation`,
          { duration: 4000 }
        );
      } else {
        toast.success("✅ All notes synced!", { duration: 3000 });
      }

    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error("Failed to sync notes: " + (error.message || "Unknown error"));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={syncing || !keypair?.zkAddress}
      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border-white/10"
    >
      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync Notes'}</span>
      <span className="sm:hidden">{syncing ? '...' : 'Sync'}</span>
      {lastSyncResult && lastSyncResult.syncedNotes > 0 && !syncing && (
        <CheckCircle className="w-3 h-3 text-green-400" />
      )}
    </Button>
  );
}