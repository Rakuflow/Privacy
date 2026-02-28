import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  zkAddress: string;
  commitment: string;
  amount: string;
  rho: string;
  rcm: string;
  isSpent: boolean;
  leafIndex?: string;
  transactionHash?: string;
  createdAt: Date;
}

const NoteSchema = new Schema<INote>({
  zkAddress: { type: String, required: true, index: true },
  commitment: { type: String, required: true, unique: true },
  amount: { type: String, required: true },
  rho: { type: String, required: true },
  rcm: { type: String, required: true },
  isSpent: { type: Boolean, default: false },
  leafIndex: { type: String },
  transactionHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient queries
NoteSchema.index({ zkAddress: 1, isSpent: 1 });

export const Note = mongoose.model<INote>('Note', NoteSchema);
