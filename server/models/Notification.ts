import mongoose, { Schema } from 'mongoose';

const NotificationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  type: { type: String, default: 'SYSTEM' },
  link: { type: String, default: '' },
}, { timestamps: true });

export const Notification = mongoose.model('Notification', NotificationSchema);
