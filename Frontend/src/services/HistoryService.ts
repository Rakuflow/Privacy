import { BaseApiService } from './BaseApiService';
import { API_ENDPOINTS } from '../config/urls';

export interface HistoryEntry {
  type: 'deposit' | 'transfer' | 'withdraw' | 'received';
  transactionHash: string;
  timestamp: number;
  amount: bigint;
  recipientZkAddress?: string;
  recipientPublicAddress?: string;
}

interface SaveHistoryRequest {
  zkAddress: string;
  type: 'deposit' | 'transfer' | 'withdraw' | 'received';
  transactionHash: string;
  timestamp: number;
  amount: string;
  recipientZkAddress?: string;
  recipientPublicAddress?: string;
}

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
