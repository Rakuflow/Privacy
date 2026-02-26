import { BaseApiService } from './BaseApiService';
import { API_ENDPOINTS } from '../config/urls';

export interface ShieldedNote {
  commitment: string;
  amount: string | number | bigint;
  rho: string;
  rcm: string;
  isSpent: boolean | string | number;
  leafIndex?: string;
  transactionHash?: string;
}

interface SaveNoteRequest {
  zkAddress: string;
  commitment: string;
  amount: string;
  rho: string;
  rcm: string;
  leafIndex?: string;
  transactionHash?: string;
}

class NoteService extends BaseApiService {
  constructor() {
    super(API_ENDPOINTS.BASE_URL);
  }

  // Get unspent notes for a zk-address
  async getUnspentNotes(zkAddress: string) {
    return this.get<{ notes: ShieldedNote[] }>(`/api/notes/${zkAddress}`);
  }

  // Save a new note
  async saveNote(note: SaveNoteRequest) {
    return this.post<{ message: string }>('/api/notes', {
      ...note,
    });
  }

  // Mark note as spent
  async markNoteAsSpent(zkAddress: string, commitment: string) {
    return this.post<{ message: string }>('/api/notes/mark-spent', {
      zkAddress,
      commitment,
    });
  }
}

export const noteService = new NoteService();
