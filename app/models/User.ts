import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  balance: number;
  portfolioValue: number;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  country: { type: String, required: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 1000000 }, // Starting balance of $1M
  portfolioValue: { type: Number, default: 0 }, // Value of open positions
  createdAt: { type: Date, default: Date.now },
}, {
    collection: 'users'
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

