/**
 * Note Storage - Store user's shielded notes via API
 * Each note represents a deposit/transfer that user owns
 */

import { noteService } from '../services/NoteService';

export interface ShieldedNote {
  amount: bigint;
  rho: string;
  rcm: string;
  spendingKey?: string;
  commitment: string;
  leafIndex?: string;
  isSpent?: boolean;
  transactionHash?: string;
}

function formatBalance(amount: bigint): string {
  return (Number(amount) / 1e18).toFixed(4);
}

// Save note to backend
export async function saveNote(zkAddress: string, note: ShieldedNote): Promise<void> {
  try {
    const response = await noteService.saveNote({
      zkAddress,
      commitment: note.commitment,
      amount: note.amount.toString(),
      rho: note.rho,
      rcm: note.rcm,
      leafIndex: note.leafIndex,
      transactionHash: note.transactionHash,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to save note');
    }

    console.log("✓ Note saved:", {
      zkAddress: zkAddress.slice(0, 15) + "...",
      commitment: note.commitment.slice(0, 20) + "...",
      amount: formatBalance(note.amount) + " STRK",
    });
  } catch (error) {
    console.error("Failed to save note:", error);
    throw error;
  }
}

// Get all notes for zkAddress (from backend)
export async function getNotes(zkAddress: string): Promise<ShieldedNote[]> {
  try {
    const response = await noteService.getUnspentNotes(zkAddress);
    
    if (!response.success || !response.data) {
      return [];
    }

    return response.data.notes.map((n: any) => ({
      ...n,
      amount: BigInt(n.amount),
    }));
  } catch (error) {
    console.error("Failed to get notes:", error);
    return [];
  }
}

// DEPRECATED: Sync version - kept for backwards compatibility
// Use getUnspentNotesAsync instead
export function getUnspentNotes(zkAddress: string): ShieldedNote[] {
  console.warn("⚠️ getUnspentNotes is deprecated. Use getUnspentNotesAsync instead");
  return [];
}

// Async version for hooks/components
export async function getUnspentNotesAsync(zkAddress: string): Promise<ShieldedNote[]> {
  const notes = await getNotes(zkAddress);
  return notes.filter(note => !note.isSpent);
}

// Mark note as spent
export async function markNoteAsSpent(zkAddress: string, commitment: string): Promise<void> {
  try {
    const response = await noteService.markNoteAsSpent(zkAddress, commitment);

    if (!response.success) {
      throw new Error(response.error || 'Failed to mark note as spent');
    }

    console.log("✓ Note marked as spent:", {
      zkAddress: zkAddress.slice(0, 15) + "...",
      commitment: commitment.slice(0, 20) + "...",
    });
  } catch (error) {
    console.error("Failed to mark note as spent:", error);
    throw error;
  }
}

// Update note's leaf index (not used with API, but kept for compatibility)
export function updateNoteLeafIndex(zkAddress: string, commitment: string, leafIndex: string): void {
  console.warn("⚠️ updateNoteLeafIndex is deprecated with API backend");
  // Notes are managed by backend, leaf index updates handled there
}

// Get total shielded balance
export async function getShieldedBalance(zkAddress: string): Promise<bigint> {
  const unspentNotes = await getUnspentNotesAsync(zkAddress);
  return unspentNotes.reduce((sum, note) => sum + note.amount, 0n);
}

// Export/import functions (keep for backup)
export function exportNotes(notes: ShieldedNote[]): string {
  return JSON.stringify(notes, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2);
}
