import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for anonymous contact
  type: { 
    type: String, 
    enum: ['like', 'comment', 'follow', 'mention', 'subscription', 'contact_message', 'new_post'], 
    required: true 
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  contactMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'ContactMessage' },
  message: String,
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
