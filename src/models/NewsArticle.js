import mongoose from 'mongoose';

const NewsArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String },  // AI-generated detailed summary (3-4 sentences)
  keyTakeaways: [{ type: String }],  // AI-generated bullet points for quick reading
  sourceUrl: { type: String, required: true, unique: true },  // Dedup key
  sourceName: { type: String, required: true },
  sourceIcon: { type: String },  // Emoji or favicon
  imageUrl: { type: String },
  topics: [{ type: String }],  // AI-assigned tags
  isApproved: { type: Boolean, default: false },
  rejectionReason: { type: String },
  publishedAt: { type: Date, default: Date.now },
  // Engagement metrics
  viewCount: { type: Number, default: 0 },
  savedCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
}, { timestamps: true });

NewsArticleSchema.index({ isApproved: 1, publishedAt: -1 });
NewsArticleSchema.index({ topics: 1 });
NewsArticleSchema.index({ sourceUrl: 1 }, { unique: true });
NewsArticleSchema.index({ savedCount: -1 });

export default mongoose.models.NewsArticle || mongoose.model('NewsArticle', NewsArticleSchema);
