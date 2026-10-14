import mongoose from 'mongoose';

const ContactMessageSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true, maxlength: 100 },
  senderEmail: { type: String, required: true, maxlength: 200 },
  subject: { type: String, maxlength: 200, default: '' },
  message: { type: String, required: true, maxlength: 5000 },
  isRead: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

ContactMessageSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
ContactMessageSchema.index({ recipient: 1, isArchived: 1 });

export default mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema);
