import mongoose from 'mongoose';

/**
 * Singleton document holding the global automation "master switch".
 * When `paused` is true, EVERY content pipeline is halted — scheduled crons
 * AND manual "Run Now" triggers — until an admin resumes it.
 */
const AutomationStateSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'global' },
  paused: { type: Boolean, default: false },
  pausedAt: { type: Date, default: null },
  pausedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

export default mongoose.models.AutomationState || mongoose.model('AutomationState', AutomationStateSchema);
