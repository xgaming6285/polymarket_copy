import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  country: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, {
    collection: 'users' // Explicitly setting the collection name as requested ("outer separate collection")
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

