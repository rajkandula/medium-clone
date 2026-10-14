import mongoose from 'mongoose';

const ResearchPaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    authors: {
      type: [String],
      default: [],
    },
    abstract: {
      type: String,
      required: true,
    },
    sourceUrl: {
      type: String,
      required: true,
      unique: true,
    },
    sourceName: {
      type: String,
      required: true,
      default: 'arXiv',
    },
    publishedAt: {
      type: Date,
      required: true,
    },
    topics: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
    },
    keyTakeaways: {
      type: [String],
      default: [],
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    // Engagement metrics
    viewCount: { type: Number, default: 0 },
    savedCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

ResearchPaperSchema.index({ isApproved: 1, publishedAt: -1 });
ResearchPaperSchema.index({ savedCount: -1 });

// Prevent re-compilation of model
const ResearchPaper = mongoose.models.ResearchPaper || mongoose.model('ResearchPaper', ResearchPaperSchema);

export default ResearchPaper;
