import mongoose, { Schema, Document } from 'mongoose';

export interface IHistory extends Document {
  zkAddress: string;
  type: 'deposit' | 'transfer' | 'withdraw' | 'received';
  transactionHash: string;
  timestamp: number;
  amount: bigint;
  recipientZkAddress?: string;
  recipientPublicAddress?: string;
  createdAt: Date;
}

const HistorySchema = new Schema<IHistory>({
  zkAddress: { type: String, required: true, index: true },
  type: { 
    type: String, 
    required: true,
    enum: ['deposit', 'transfer', 'withdraw', 'received']
  },
  transactionHash: { type: String, required: true },
  timestamp: { type: Number, required: true },
  amount: { type: String, required: true },
  recipientZkAddress: { type: String },
  recipientPublicAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient queries
HistorySchema.index({ zkAddress: 1, timestamp: -1 });

export const History = mongoose.model<IHistory>('History', HistorySchema);
