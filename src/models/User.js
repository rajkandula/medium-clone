import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String },
  avatar: String,
  coverImage: String,
  bio: { type: String, maxlength: 500 },
  about: { type: String }, // Long-form about section for personal website profile
  interests: [{ type: String }],
  currentStatus: {
    text: { type: String, maxlength: 100 },
    emoji: { type: String, default: '🔨' },
    updatedAt: Date,
  },
  socialLinks: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  authProvider: { type: String, enum: ['local'], default: 'local' },
  subscription: {
    plan: { type: String, enum: ['free', 'writer'], default: 'free' },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date,
  },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  postsCount: { type: Number, default: 0 },
  // Bumped to invalidate all previously-issued JWT sessions (password reset,
  // "log out everywhere"). The session's `tv` claim must match this value.
  tokenVersion: { type: Number, default: 0 },
  pinnedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // Max 3 pinned posts
  experience: [{
    company: { type: String, required: true },
    role: { type: String, required: true },
    period: String,
    description: String,
    current: { type: Boolean, default: false },
  }],
  preferences: {
    theme: { type: String, default: 'dark' },
    emailDigest: { type: Boolean, default: true },
    notifications: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
  },
  profileDesign: {
    template: { type: String, enum: ['default', 'minimal'], default: 'default' },
    tabs: {
      articles: { type: Boolean, default: true },
      about: { type: Boolean, default: true },
      projects: { type: Boolean, default: true },
      contact: { type: Boolean, default: true },
      experience: { type: Boolean, default: false },
      social: { type: Boolean, default: true },
    },
    tabOrder: {
      type: [String],
      default: ['articles', 'social', 'contact']
    },
    customTabs: {
      type: [{
        id: { type: String, required: true },
        label: { type: String, required: true, maxlength: 30 },
        content: { type: String, maxlength: 5000 },
        posts: [{ type: String }],
        visible: { type: Boolean, default: true },
      }],
      default: [],
      _id: false,
    },
  },
  projects: [{
    title: { type: String, required: true },
    description: String,
    url: String,
    imageUrl: String,
  }],
  contactDetails: {
    publicEmail: String,
    message: String,
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  profileViewCount: { type: Number, default: 0 },
  lastLoginAt: Date,
}, { timestamps: true });

UserSchema.index({ interests: 1 });

// Force re-register during dev hot reload to pick up schema changes
if (mongoose.models.User) {
  delete mongoose.models.User;
}
export default mongoose.model('User', UserSchema);
