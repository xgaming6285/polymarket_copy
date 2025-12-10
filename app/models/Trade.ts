import mongoose, { Schema, Document } from 'mongoose';

export interface ITrade extends Document {
  userId: mongoose.Types.ObjectId;
  positionId: mongoose.Types.ObjectId;
  eventId: string;
  eventTitle: string;
  marketId: string;
  outcomeTitle: string;
  type: 'buy' | 'sell';
  outcome: 'Yes' | 'No';
  shares: number;
  price: number;
  total: number;
  createdAt: Date;
}

const TradeSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  positionId: { type: Schema.Types.ObjectId, ref: 'Position', required: true },
  eventId: { type: String, required: true },
  eventTitle: { type: String, required: true },
  marketId: { type: String, required: true },
  outcomeTitle: { type: String, required: true },
  type: { type: String, enum: ['buy', 'sell'], required: true },
  outcome: { type: String, enum: ['Yes', 'No'], required: true },
  shares: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
}, {
  collection: 'trades'
});

export default mongoose.models.Trade || mongoose.model<ITrade>('Trade', TradeSchema);

