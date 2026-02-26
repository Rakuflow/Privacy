import { noteService } from '../services/NoteService';
import type { ShieldedNote } from '../types/NoteStorage.type';

function formatBalance(amount: bigint): string {
  return (Number(amount) / 1e18).toFixed(4);
}

function parseAmountToBigInt(value: unknown): bigint | null {
  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
    return BigInt(Math.trunc(value));
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    try {
      return BigInt(normalized);
    } catch {
      const maybeDecimal = Number(normalized);
      if (!Number.isFinite(maybeDecimal)) {
        return null;
      }
      return BigInt(Math.floor(maybeDecimal * 1e18));
    }
  }

  return null;
}

function parseSpentFlag(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === '') {
      return false;
    }
    return false;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return false;
}

function normalizeNote(raw: any): ShieldedNote | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const amount = parseAmountToBigInt(raw.amount);
  if (amount === null) {
    return null;
  }

  const commitment = typeof raw.commitment === 'string' ? raw.commitment : '';
  if (!commitment) {
    return null;
  }

  return {
    amount,
    rho: typeof raw.rho === 'string' ? raw.rho : '',
    rcm: typeof raw.rcm === 'string' ? raw.rcm : '',
    spendingKey: typeof raw.spendingKey === 'string' ? raw.spendingKey : undefined,
    commitment,
    leafIndex: raw.leafIndex != null ? String(raw.leafIndex) : undefined,
    isSpent: parseSpentFlag(raw.isSpent),
    transactionHash: raw.transactionHash != null ? String(raw.transactionHash) : undefined,
  };
}

function dedupeNotes(notes: ShieldedNote[]): ShieldedNote[] {
  const byCommitment = new Map<string, ShieldedNote>();

  for (const note of notes) {
    const existing = byCommitment.get(note.commitment);
    if (!existing) {
      byCommitment.set(note.commitment, note);
      continue;
    }

    // Prefer unspent version if duplicates come from mixed sources.
    if (existing.isSpent && !note.isSpent) {
      byCommitment.set(note.commitment, note);
    }
  }

  return Array.from(byCommitment.values());
}

function getLegacyNotes(zkAddress: string): ShieldedNote[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  const legacyKeys = [`shieldedNotes_${zkAddress}`, `receivedNotes_${zkAddress}`];

  const legacyRaw: any[] = [];
  for (const key of legacyKeys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        legacyRaw.push(...parsed);
      }
    } catch {
      // Ignore malformed legacy data and continue.
    }
  }

  return dedupeNotes(legacyRaw.map(normalizeNote).filter((note): note is ShieldedNote => note !== null));
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
  } catch (error) {
    console.error('Failed to save note:', error);
    throw error;
  }
}

// Get all notes for zkAddress (from backend)
export async function getNotes(zkAddress: string): Promise<ShieldedNote[]> {
  const collectedNotes: ShieldedNote[] = [];

  try {
    const response = await noteService.getUnspentNotes(zkAddress);

    if (response.success && response.data) {
      const payload = response.data as any;
      const rawNotes = Array.isArray(payload.notes) ? payload.notes : Array.isArray(payload?.data?.notes) ? payload.data.notes : [];

      if (rawNotes.length > 0) {
        collectedNotes.push(...rawNotes.map(normalizeNote).filter((note: any): note is ShieldedNote => note !== null));
      }
    }
  } catch (error) {
    console.error('Failed to get notes:', error);
  }

  const legacyNotes = getLegacyNotes(zkAddress);
  if (legacyNotes.length > 0) {
    collectedNotes.push(...legacyNotes);
  }

  return dedupeNotes(collectedNotes);
}

// DEPRECATED: Sync version - kept for backwards compatibility
// Use getUnspentNotesAsync instead
export function getUnspentNotes(zkAddress: string): ShieldedNote[] {
  console.warn('⚠️ getUnspentNotes is deprecated. Use getUnspentNotesAsync instead');
  return [];
}

// Async version for hooks/components
export async function getUnspentNotesAsync(zkAddress: string): Promise<ShieldedNote[]> {
  const notes = await getNotes(zkAddress);
  return notes.filter((note) => note.isSpent !== true);
}

// Mark note as spent
export async function markNoteAsSpent(zkAddress: string, commitment: string): Promise<void> {
  try {
    const response = await noteService.markNoteAsSpent(zkAddress, commitment);

    if (!response.success) {
      throw new Error(response.error || 'Failed to mark note as spent');
    }
  } catch (error) {
    console.error('Failed to mark note as spent:', error);
    throw error;
  }
}

// Update note's leaf index (not used with API, but kept for compatibility)
export function updateNoteLeafIndex(zkAddress: string, commitment: string, leafIndex: string): void {
  console.warn('⚠️ updateNoteLeafIndex is deprecated with API backend');
  // Notes are managed by backend, leaf index updates handled there
}

// Get total shielded balance
export async function getShieldedBalance(zkAddress: string): Promise<bigint> {
  const unspentNotes = await getUnspentNotesAsync(zkAddress);
  return unspentNotes.reduce((sum, note) => sum + note.amount, 0n);
}

// Export/import functions (keep for backup)
export function exportNotes(notes: ShieldedNote[]): string {
  return JSON.stringify(notes, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2);
}
