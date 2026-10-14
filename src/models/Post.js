import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, maxlength: 300 },
  content: { type: String, required: true },
  coverImage: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  tags: [{ type: String, lowercase: true }],
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  format: { type: String, enum: ['richtext', 'latex', 'markdown', 'html', 'product'], default: 'richtext' },
  readTime: { type: Number, default: 1 },
  viewCount: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  bookmarksCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isAiGenerated: { type: Boolean, default: false },
  qualityScore: { type: Number }, // AI fact-check score (0-100) for AI-generated drafts
  reviewNotes: { type: String },  // AI fact-check accuracy notes, shown to admin at review time
  isPinned: { type: Boolean, default: false },
  collections: [{ type: String, trim: true }],
  seoTitle: String,
  seoDescription: String,
  productUrl: String,
  appName: String,
  pricing: String,
  launchDate: Date,
  appDescription: String,
  appImages: [{ type: String }],
  appIcon: String,
  publishedAt: Date,
  systemArchitecture: String,
  techStack: String,
  dbSchema: String,
  apiSpecs: String,
  devPlan: String,
}, { timestamps: true });

PostSchema.index({ author: 1, status: 1 });
PostSchema.index({ author: 1, status: 1, publishedAt: -1 });
PostSchema.index({ author: 1, status: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ category: 1, publishedAt: -1 });
PostSchema.index({ status: 1, publishedAt: -1 });
PostSchema.index({ title: 'text', content: 'text', tags: 'text' });

PostSchema.pre('save', function() {
  if (!this.excerpt || this.excerpt.trim() === '') {
    const raw = this.content || '';
    let text = raw.replace(/<style[\s\S]*?<\/style>/gi, ' ')
                  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, ' ')
                  .replace(/[{}[\]]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
    this.excerpt = text.substring(0, 280).trim() + (text.length > 280 ? '...' : '');
  }
});

if (mongoose.models.Post) {
  delete mongoose.models.Post;
}
export default mongoose.model('Post', PostSchema);
