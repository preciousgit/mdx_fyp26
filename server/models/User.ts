import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  role: { type: String, enum: ['producer', 'distributor', 'regulator', 'consumer'], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, default: '' },
  companyName: { type: String, default: '' },
  companyPrefix: { type: String, default: '' },
  documentsVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  walletAddress: { type: String, default: '' },
  address: { type: String, default: '' },
  avatar: { type: String, default: '' },
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
