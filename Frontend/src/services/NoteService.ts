import { BaseApiService } from './BaseApiService';
import { API_ENDPOINTS } from '../config/urls';
import type { SaveNoteRequest, ShieldedNote } from '../types/NoteService.type';

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
