/**
 * Note Storage - Store user's shielded notes locally
 * Each note represents a deposit/transfer that user owns
 * 
 * KEY DESIGN: Uses zkAddress as the primary key (not walletAddress)
 * - Deposit: Save to shieldedNotes_{sender_zkAddress}
 * - Transfer: Save to shieldedNotes_{receiver_zkAddress}
 * - Withdraw: Mark note as spent in shieldedNotes_{sender_zkAddress}
 */

export interface ShieldedNote {
  // Note details
  amount: bigint;
  rho: string;
  rcm: string;
  spendingKey: string;
  commitment: string;
  
  // Metadata
  leafIndex?: string;
  transactionHash?: string;
  timestamp?: number;
  isSpent?: boolean;
  type?: "deposit" | "received" | "withdraw";
}

/**
 * Format balance for display
 */
function formatBalance(amount: bigint): string {
  return (Number(amount) / 1e18).toFixed(4);
}

/**
 * Save a note to localStorage using zkAddress as key
 */
export function saveNote(zkAddress: string, note: ShieldedNote): void {
  const notes = getNotes(zkAddress);
  notes.push({
    ...note,
    amount: note.amount.toString(), // Convert BigInt to string for storage
  } as any);
  
  const key = `shieldedNotes_${zkAddress}`;
  localStorage.setItem(key, JSON.stringify(notes));
  
  console.log("✓ Note saved:", {
    zkAddress: zkAddress.slice(0, 15) + "...",
    commitment: note.commitment.slice(0, 20) + "...",
    amount: formatBalance(note.amount) + " STRK",
    type: note.type,
  });
}

/**
 * Get all notes for a zkAddress
 */
export function getNotes(zkAddress: string): ShieldedNote[] {
  const key = `shieldedNotes_${zkAddress}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) return [];
  
  try {
    const notes = JSON.parse(stored);
    // Convert amount strings back to BigInt
    return notes.map((n: any) => ({
      ...n,
      amount: BigInt(n.amount),
      isSpent: n.isSpent ?? false,
    }));
  } catch {
    return [];
  }
}

/**
 * Get unspent notes (available balance)
 */
export function getUnspentNotes(zkAddress: string): ShieldedNote[] {
  return getNotes(zkAddress).filter(note => !note.isSpent);
}

/**
 * Mark a note as spent
 */
export function markNoteAsSpent(zkAddress: string, commitment: string): void {
  const notes = getNotes(zkAddress);
  const updated = notes.map(note => {
    if (note.commitment === commitment) {
      return { ...note, isSpent: true };
    }
    return note;
  });
  
  const key = `shieldedNotes_${zkAddress}`;
  localStorage.setItem(key, JSON.stringify(updated.map(n => ({
    ...n,
    amount: n.amount.toString(),
  }))));
  
  console.log("✓ Note marked as spent:", {
    zkAddress: zkAddress.slice(0, 15) + "...",
    commitment: commitment.slice(0, 20) + "...",
  });
}

/**
 * Get total shielded balance for a zkAddress
 */
export function getShieldedBalance(zkAddress: string): bigint {
  const unspentNotes = getUnspentNotes(zkAddress);
  return unspentNotes.reduce((sum, note) => sum + note.amount, 0n);
}

/**
 * Update note's leaf index (after syncing with chain)
 */
export function updateNoteLeafIndex(zkAddress: string, commitment: string, leafIndex: string): void {
  const notes = getNotes(zkAddress);
  const updated = notes.map(note => {
    if (note.commitment === commitment) {
      return { ...note, leafIndex };
    }
    return note;
  });
  
  const key = `shieldedNotes_${zkAddress}`;
  localStorage.setItem(key, JSON.stringify(updated.map(n => ({
    ...n,
    amount: n.amount.toString(),
  }))));
}

/**
 * Clear all notes for a zkAddress
 */
export function clearNotes(zkAddress: string): void {
  const key = `shieldedNotes_${zkAddress}`;
  localStorage.removeItem(key);
  console.log("✓ Notes cleared for zkAddress:", zkAddress.slice(0, 15) + "...");
}

/**
 * Export notes to JSON (for backup)
 */
export function exportNotes(zkAddress: string): string {
  const notes = getNotes(zkAddress);
  return JSON.stringify(notes, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2);
}

/**
 * Import notes from JSON (for restore)
 */
export function importNotes(zkAddress: string, json: string): void {
  try {
    const notes = JSON.parse(json);
    const key = `shieldedNotes_${zkAddress}`;
    localStorage.setItem(key, JSON.stringify(notes));
    console.log("✓ Notes imported successfully for zkAddress:", zkAddress.slice(0, 15) + "...");
  } catch (error) {
    console.error("Failed to import notes:", error);
    throw new Error("Invalid notes backup file");
  }
}

/**
 * Debug: List all shielded notes keys in localStorage
 */
export function debugListAllNotesKeys(): string[] {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('shieldedNotes_'));
  console.log("📦 All shielded notes keys:", keys.map(k => k.slice(0, 30) + "..."));
  return keys;
}

/**
 * Debug: Get notes count for a zkAddress
 */
export function debugGetNotesInfo(zkAddress: string): { total: number; unspent: number; balance: string } {
  const allNotes = getNotes(zkAddress);
  const unspentNotes = getUnspentNotes(zkAddress);
  const balance = getShieldedBalance(zkAddress);
  
  const info = {
    total: allNotes.length,
    unspent: unspentNotes.length,
    balance: formatBalance(balance) + " STRK",
  };
  
  console.log(`📊 Notes info for ${zkAddress.slice(0, 15)}...`, info);
  return info;
}
