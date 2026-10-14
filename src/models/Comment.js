import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  content: { type: String, required: true, maxlength: 2000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  likesCount: { type: Number, default: 0 },
  isEdited: { type: Boolean, default: false },
}, { timestamps: true });

CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1 });

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
