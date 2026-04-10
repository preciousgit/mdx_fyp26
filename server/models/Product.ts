import mongoose, { Schema } from 'mongoose';

const ProductSchema = new Schema({
  _id: { type: String },
  producerId: { type: String, required: true },
  producerName: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  packagingType: { type: String, default: 'item' },
  weight: { type: String, default: '' },
  size: { type: String, default: '' },
  // Extended registration fields
  batchNumber: { type: String, default: '' },
  barcode: { type: String, default: '' },
  origin: { type: String, default: '' },
  manufacturingDate: { type: String, default: '' },
  expiryDate: { type: String, default: '' },
  storageConditions: { type: String, default: '' },
  allergens: { type: String, default: '' },
  certifications: { type: String, default: '' },
  // Review aggregate
  reviewScore: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  // Status & risk
  status: { type: String, default: 'registered' },
  riskScore: { type: Number, default: 0 },
  images: { type: [String], default: [] },
  video: { type: String, default: '' },
}, { timestamps: true, _id: false });

export const Product = mongoose.model('Product', ProductSchema);
