import mongoose from 'mongoose';

const ApiKeySchema = new mongoose.Schema({
  keyHash: { type: String, required: true },
  prefix: { type: String, required: true }, // First 8 chars for display (e.g. "bw_a1b2c3")
  name: { type: String, required: true, default: 'Default' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastUsedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null }, // null = never expires
}, { timestamps: true });

ApiKeySchema.index({ user: 1 });
ApiKeySchema.index({ keyHash: 1 }, { unique: true });

export default mongoose.models.ApiKey || mongoose.model('ApiKey', ApiKeySchema);
