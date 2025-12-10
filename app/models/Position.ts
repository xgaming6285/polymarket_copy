import mongoose, { Schema, Document } from 'mongoose';

export interface IPosition extends Document {
  userId: mongoose.Types.ObjectId;
  eventId: string;
  eventTitle: string;
  eventImage?: string;
  marketId: string;
  outcomeTitle: string;
  outcome: 'Yes' | 'No';
  shares: number;
  averagePrice: number;
  investedAmount: number;
  currentPrice: number;
  status: 'open' | 'closed' | 'settled';
  profitLoss: number;
  settlementOutcome?: 'Yes' | 'No'; // The winning outcome when settled
  createdAt: Date;
  closedAt?: Date;
}

const PositionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  eventId: { type: String, required: true },
  eventTitle: { type: String, required: true },
  eventImage: { type: String },
  marketId: { type: String, required: true },
  outcomeTitle: { type: String, required: true },
  outcome: { type: String, enum: ['Yes', 'No'], required: true },
  shares: { type: Number, required: true },
  averagePrice: { type: Number, required: true },
  investedAmount: { type: Number, required: true },
  currentPrice: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'closed', 'settled'], default: 'open' },
  profitLoss: { type: Number, default: 0 },
  settlementOutcome: { type: String, enum: ['Yes', 'No'] },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
}, {
  collection: 'positions'
});

// Compound index for faster lookups
PositionSchema.index({ userId: 1, marketId: 1, outcome: 1 });

export default mongoose.models.Position || mongoose.model<IPosition>('Position', PositionSchema);

