import mongoose from 'mongoose';

const SuggestedTopicSchema = new mongoose.Schema({
  topic: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  tags: [String],
  // Set once the publisher (generate-posts) consumes this topic, so it is never
  // auto-published twice. The copilot topic picker samples randomly and ignores this.
  used: { type: Boolean, default: false },
  usedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.SuggestedTopic || mongoose.model('SuggestedTopic', SuggestedTopicSchema);
