import mongoose, { Schema } from 'mongoose';

const ReplySchema = new Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userRole: { type: String, default: 'consumer' },
  comment: { type: String, required: true },
  likes: { type: [String], default: [] },
  dislikes: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const ReviewSchema = new Schema({
  productId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userRole: { type: String, default: 'consumer' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  likes: { type: [String], default: [] },
  dislikes: { type: [String], default: [] },
  replies: { type: [ReplySchema], default: [] },
}, { timestamps: true });

export const Review = mongoose.model('Review', ReviewSchema);
