import mongoose from 'mongoose';

const CronLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['generate-posts', 'fetch-news', 'fetch-research', 'generate-topics', 'generate-series'],
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'partial', 'failed', 'skipped'],
    default: 'success',
  },
  stats: {
    attempted: { type: Number, default: 0 },
    succeeded: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    filtered: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },
  },
  // Per-item details — topics picked, titles generated, errors, AI reasoning
  details: [{
    topic: String,
    title: String,
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    category: String,
    tags: [String],
    coverStyle: String,
    hasCoverImage: Boolean,
    error: String,
    reasoning: String, // AI's reasoning for picking this topic/config
  }],
  duration: { type: Number, default: 0 }, // milliseconds
  triggeredBy: {
    type: String,
    enum: ['cron', 'manual'],
    default: 'cron',
  },
  triggeredByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  errorMessage: String, // Top-level error if entire run failed
  startedAt: { type: Date, required: true },
  completedAt: { type: Date },
}, { timestamps: true });

CronLogSchema.index({ type: 1, createdAt: -1 });
CronLogSchema.index({ status: 1 });

export default mongoose.models.CronLog || mongoose.model('CronLog', CronLogSchema);
