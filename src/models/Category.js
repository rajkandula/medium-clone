import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  icon: String,
  color: { type: String, default: '#f59e0b' },
  postsCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
