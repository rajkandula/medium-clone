import mongoose from 'mongoose';

const AutomationConfigSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['generate-posts', 'fetch-news', 'fetch-research', 'generate-topics', 'generate-series'],
    required: true,
    unique: true,
  },
  enabled: { type: Boolean, default: true },
  label: { type: String, required: true }, // "Blog Post Generator", "Pulse News", etc.
  description: { type: String },
  schedule: { type: String, required: true }, // Human-readable: "Every day at 6am & 6pm"
  cronExpression: { type: String, required: true }, // "0 6,18 * * *"
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    // For generate-posts: { postCount: 4, tone: 'professional', length: 'medium' }
    // For fetch-news: { maxToProcess: 10 }
    // For fetch-research: {}
  },
  lastRunAt: { type: Date },
  lastRunStatus: {
    type: String,
    enum: ['success', 'partial', 'failed', 'skipped', null],
    default: null,
  },
  lastRunStats: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
}, { timestamps: true });

AutomationConfigSchema.index({ type: 1 }, { unique: true });

/**
 * Ensure default configs exist for all 3 pipelines.
 * Call this on first API access.
 */
AutomationConfigSchema.statics.ensureDefaults = async function () {
  const defaults = [
    {
      type: 'generate-posts',
      label: 'Blog Post Generator',
      description: 'AI generates 3-5 blog posts on trending tech, career, and development topics with cover images.',
      schedule: 'Every day at 6:00 AM & 6:00 PM UTC',
      cronExpression: '0 6,18 * * *',
      settings: { postCount: 4, tone: 'professional', length: 'medium' },
    },
    {
      type: 'fetch-news',
      label: 'Pulse News Fetcher',
      description: 'Curates tech news from RSS feeds, filters with AI, and generates summaries & key takeaways.',
      schedule: 'Every 4 hours',
      cronExpression: '0 */4 * * *',
      settings: { maxToProcess: 10 },
    },
    {
      type: 'fetch-research',
      label: 'Research Paper Fetcher',
      description: 'Fetches latest AI & CS research papers from arXiv and indexes them for the Research page.',
      schedule: 'Every 6 hours',
      cronExpression: '0 */6 * * *',
      settings: {},
    },
    {
      type: 'generate-topics',
      label: 'Topic Generator',
      description: 'AI generates 30 fresh, diverse blog topic suggestions for content creators across all categories.',
      schedule: 'Daily at midnight UTC',
      cronExpression: '0 0 * * *',
      settings: {},
    },
    {
      type: 'generate-series',
      label: 'Learning Path Builder',
      description: 'AI groups existing published posts into ordered beginner-to-advanced learning paths, one per category.',
      schedule: 'Weekly, Sunday 3:00 AM UTC',
      cronExpression: '0 3 * * 0',
      settings: { maxSeriesPerRun: 3, minPosts: 4, maxPosts: 8 },
    },
  ];

  for (const config of defaults) {
    await this.findOneAndUpdate(
      { type: config.type },
      { $setOnInsert: config },
      { upsert: true, new: true }
    );
  }
};

export default mongoose.models.AutomationConfig || mongoose.model('AutomationConfig', AutomationConfigSchema);
