/**
 * Note Sync Utility
 * Syncs local notes with on-chain events to update balance
 */

import { ShieldedNote, getUnspentNotes, updateNoteLeafIndex } from "./noteStorage";
import { getAllCommitmentsOnChain, getSpentNullifiers } from "../contracts/eventScanner";
import { computeNullifierHash } from "./zkProofGenerator";

export interface SyncResult {
  totalNotes: number;
  syncedNotes: number;
  unconfirmedNotes: number;
  balance: bigint;
}

/**
 * Sync notes with on-chain events
 * Updates leaf_index for notes and verifies they exist on-chain
 */
export async function syncNotesWithChain(
  zkAddress: string,
  onProgress?: (progress: { current: number; total: number; message: string }) => void
): Promise<SyncResult> {
  try {
    console.log("🔄 Starting note sync for zkAddress:", zkAddress.slice(0, 15) + "...");
    
    onProgress?.({ current: 0, total: 100, message: "Fetching on-chain commitments..." });
    
    // Get all commitments from chain
    const commitmentMap = await getAllCommitmentsOnChain(0);
    
    onProgress?.({ current: 30, total: 100, message: "Fetching spent nullifiers..." });
    
    // Get spent nullifiers
    const spentNullifiers = await getSpentNullifiers(0);
    
    onProgress?.({ current: 60, total: 100, message: "Syncing local notes..." });
    
    // Get all unspent notes for this zkAddress
    const localNotes = getUnspentNotes(zkAddress);
    
    let syncedCount = 0;
    let unconfirmedCount = 0;
    let totalBalance = 0n;
    
    for (let i = 0; i < localNotes.length; i++) {
      const note = localNotes[i];
      
      onProgress?.({
        current: 60 + Math.floor((i / localNotes.length) * 40),
        total: 100,
        message: `Checking note ${i + 1}/${localNotes.length}...`,
      });
      
      // Check if commitment exists on-chain
      const leafIndex = commitmentMap.get(note.commitment);
      
      if (leafIndex !== undefined) {
        // Note is on-chain, update leaf index if needed
        if (note.leafIndex !== leafIndex) {
          console.log(`✅ Note confirmed on-chain at leaf ${leafIndex}`);
          updateNoteLeafIndex(zkAddress, note.commitment, leafIndex);
        }
        
        // Check if note is actually spent (via nullifier)
        const nullifier = computeNullifierHash(
          note.spendingKey,
          note.rho,
          parseInt(leafIndex)
        );
        
        const isSpentOnChain = spentNullifiers.has(nullifier);
        
        if (!isSpentOnChain) {
          // Note is confirmed and unspent
          totalBalance += note.amount;
          syncedCount++;
        } else {
          console.log(`⚠️ Note spent on-chain: ${note.commitment.slice(0, 20)}...`);
        }
      } else {
        // Note not yet on-chain (pending transaction)
        console.log(`⏳ Note pending confirmation: ${note.commitment.slice(0, 20)}...`);
        unconfirmedCount++;
      }
    }
    
    onProgress?.({ current: 100, total: 100, message: "Sync complete!" });
    
    const result = {
      totalNotes: localNotes.length,
      syncedNotes: syncedCount,
      unconfirmedNotes: unconfirmedCount,
      balance: totalBalance,
    };
    
    console.log("✅ Sync complete:", result);
    return result;
  } catch (error) {
    console.error("❌ Note sync failed:", error);
    throw error;
  }
}

/**
 * Quick balance check from local notes
 * Faster than full sync, but may not be accurate if chain state changed
 */
export function getLocalBalance(zkAddress: string): bigint {
  const notes = getUnspentNotes(zkAddress);
  return notes.reduce((sum, note) => sum + note.amount, 0n);
}

/**
 * Scan blockchain for new notes received to this zk-address
 * This is needed when receiving transfers from other users
 */
export async function scanForReceivedNotes(
  zkAddress: string,
  spendingKey: string,
  onProgress?: (progress: { current: number; total: number; message: string }) => void
): Promise<number> {
  try {
    console.log("🔍 Scanning for received notes to zk-address:", zkAddress.slice(0, 15) + "...");
    
    // Notes are stored directly to recipient's zkAddress in localStorage via saveNote
    // This function verifies those notes exist on-chain
    
    onProgress?.({ current: 0, total: 100, message: "Scanning blockchain..." });
    
    // Get all commitments from chain
    const commitmentMap = await getAllCommitmentsOnChain(0);
    
    onProgress?.({ current: 50, total: 100, message: "Checking notes..." });
    
    // In a real implementation, this would:
    // 1. Try to decrypt note data from chain events
    // 2. Verify the note belongs to this spending key
    // 3. Add new notes to localStorage
    
    // For now, we rely on sender sharing note data via saveNote()
    
    onProgress?.({ current: 100, total: 100, message: "Scan complete!" });
    
    console.log("✅ Blockchain scan complete");
    return 0; // Return number of new notes found
  } catch (error) {
    console.error("❌ Note scan failed:", error);
    throw error;
  }
}
