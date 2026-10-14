import mongoose from 'mongoose';

const SeriesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, maxlength: 500 },
  coverImage: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  tags: [{ type: String, lowercase: true }],
  // Ordered beginner->advanced sequence. Mongoose arrays preserve order — this IS the path.
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  postCount: { type: Number, default: 0 }, // denormalized posts.length, kept in sync on write
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  isAiGenerated: { type: Boolean, default: false },
  publishedAt: Date,
}, { timestamps: true });

SeriesSchema.index({ status: 1, publishedAt: -1 }); // list page
SeriesSchema.index({ category: 1 });                 // category filter + dedup lookup
SeriesSchema.index({ posts: 1 });                    // "which series is this post in?" (in-post nav)

if (mongoose.models.Series) {
  delete mongoose.models.Series;
}
export default mongoose.model('Series', SeriesSchema);
