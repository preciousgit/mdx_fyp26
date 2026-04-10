import mongoose, { Schema } from 'mongoose';

const EventSchema = new Schema({
  _id: { type: String },
  productId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  actorId: { type: String, required: true },
  actorName: { type: String, required: true },
  actorRole: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  previousHash: { type: String, default: '0' },
  hash: { type: String, required: true },
}, { timestamps: true, _id: false });

export const Event = mongoose.model('Event', EventSchema);
