import mongoose from 'mongoose';

const ReadingHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  readPercentage: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

ReadingHistorySchema.index({ user: 1, post: 1 }, { unique: true });
ReadingHistorySchema.index({ user: 1, updatedAt: -1 });

export default mongoose.models.ReadingHistory || mongoose.model('ReadingHistory', ReadingHistorySchema);
