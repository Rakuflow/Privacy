import { BaseApiService } from './BaseApiService';
import { API_ENDPOINTS } from '../config/urls';
import type { HistoryEntry, SaveHistoryRequest } from '../types/History.type';

class HistoryService extends BaseApiService {
  constructor() {
    super(API_ENDPOINTS.BASE_URL);
  }

  // Get transaction history for a zk-address
  async getHistory(zkAddress: string) {
    return this.get<{ history: HistoryEntry[] }>(`/api/history/${zkAddress}`);
  }

  // Save a history entry
  async saveHistory(entry: SaveHistoryRequest) {
    return this.post<{ message: string }>('/api/history', entry);
  }
}

export const historyService = new HistoryService();
