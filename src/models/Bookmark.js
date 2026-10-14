import mongoose from 'mongoose';

const BookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemType: { type: String, enum: ['post', 'research', 'news'], default: 'post' },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  research: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchPaper', default: null },
  news: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsArticle', default: null },
}, { timestamps: true });

// Unique bookmark per user per item
BookmarkSchema.index({ user: 1, itemType: 1, post: 1 }, { unique: true, partialFilterExpression: { post: { $ne: null } } });
BookmarkSchema.index({ user: 1, itemType: 1, research: 1 }, { unique: true, partialFilterExpression: { research: { $ne: null } } });
BookmarkSchema.index({ user: 1, itemType: 1, news: 1 }, { unique: true, partialFilterExpression: { news: { $ne: null } } });
BookmarkSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Bookmark || mongoose.model('Bookmark', BookmarkSchema);
