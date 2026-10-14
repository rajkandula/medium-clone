import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  name: { type: String, maxlength: 100 },
  email: { type: String, maxlength: 200 },
  category: { type: String, enum: ['bug', 'feature', 'general', 'billing'], required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  text: { type: String, required: true, maxlength: 1000 },
  sentiment: { type: String, enum: ['happy', 'neutral', 'sad'], default: 'neutral' },
}, { timestamps: true });

FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ rating: 1 });

// Prevent hot-reload issues in development
if (mongoose.models.Feedback) {
  delete mongoose.models.Feedback;
}

export default mongoose.model('Feedback', FeedbackSchema);
