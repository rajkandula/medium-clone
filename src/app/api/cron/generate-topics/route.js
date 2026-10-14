import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { textModel as model } from '@/lib/aiProvider';
import dbConnect from '@/lib/db';
import SuggestedTopic from '@/models/SuggestedTopic';
import CronLog from '@/models/CronLog';
import { getCronSecret } from '@/lib/cronAuth';

export const maxDuration = 300;


export async function POST(req) {
  const startedAt = new Date();
  try {
    // Verify CRON secret
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '') || searchParams.get('secret') || req.headers.get('x-cron-secret');
    const expectedSecret = getCronSecret();

    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isManual = searchParams.get('manual') === 'true';
    const triggeredByUserId = req.headers.get('x-triggered-by') || null;

    await dbConnect();

    // Global emergency stop — halts ALL pipelines (scheduled AND manual) until an admin resumes.
    const { isAutomationPaused } = await import('@/lib/automationGate');
    if (await isAutomationPaused()) {
      await CronLog.create({
        type: 'generate-topics', status: 'skipped',
        stats: { attempted: 0, succeeded: 0, failed: 0 },
        duration: Date.now() - startedAt.getTime(),
        triggeredBy: isManual ? 'manual' : 'cron', startedAt, completedAt: new Date(),
        errorMessage: 'All automation paused by admin',
      });
      return NextResponse.json({ skipped: true, reason: 'All automation is paused by admin' });
    }

    // Respect this pipeline's own enable/disable toggle (manual runs bypass it).
    const AutomationConfig = (await import('@/models/AutomationConfig')).default;
    const topicsConfig = await AutomationConfig.findOne({ type: 'generate-topics' });
    if (topicsConfig && !topicsConfig.enabled && !isManual) {
      await CronLog.create({
        type: 'generate-topics', status: 'skipped',
        stats: { attempted: 0, succeeded: 0, failed: 0 },
        duration: Date.now() - startedAt.getTime(),
        triggeredBy: 'cron', startedAt, completedAt: new Date(),
      });
      return NextResponse.json({ skipped: true, reason: 'Pipeline is paused' });
    }

    const prompt = `You are an expert blog content strategist for a general-interest publication with a broad readership (not only developers). Brainstorm 40 fresh, diverse, and highly engaging blog post topic ideas/prompts.

Distribute the topics across BOTH general-interest and technical categories, with roughly half general-interest so the blog is genuinely useful to everyone. Use these categories (match the category name exactly):
- AI & Machine Learning
- Web Development
- DevOps & Cloud
- Data & Security
- Design & UX
- Career & Productivity
- Startups & Business
- Personal Finance
- Health & Wellness
- Food & Cooking
- Travel & Culture
- Lifestyle & Home
- Parenting & Education
- Science & Nature
- Economics & Finance
- Books & Ideas

Every topic must TEACH something evergreen the reader can apply — a method, tactic, framework, how-to, technique, or a clear explanation of how something works or a new way to do/understand it. Do NOT propose news, current events, or anything tied to a specific date, announcement, or headline (no "X just happened", no politics-as-events, no product releases, no scandals). Make topics specific and click-worthy, avoid generic short titles, and include 2-4 relevant tags per topic.

Return ONLY a valid JSON array of objects, with no markdown code fences, no explanation, no text outside the JSON array:
[
  {
    "topic": "The specific topic or prompt (e.g., '10 Hidden CSS Features Every Frontend Developer Must Know in 2026')",
    "category": "The category name (exactly matching one of the categories listed above)",
    "tags": ["css", "frontend", "web-dev"]
  },
  ...
]`;

    const topicResult = await generateText({
      model,
      prompt,
    });

    let topics = [];
    try {
      const cleaned = topicResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      topics = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[GenerateTopics] Failed to parse JSON from AI response:', parseErr);
      throw new Error(`Failed to parse AI response: ${topicResult.text.substring(0, 200)}`);
    }

    if (!Array.isArray(topics)) {
      throw new Error('AI response is not an array');
    }

    let succeeded = 0;
    let duplicates = 0;
    const details = [];

    for (const item of topics) {
      if (!item.topic || !item.category) continue;
      try {
        await SuggestedTopic.create({
          topic: item.topic.trim(),
          category: item.category.trim(),
          tags: Array.isArray(item.tags) ? item.tags.map(t => t.toLowerCase().trim()) : []
        });
        succeeded++;
        details.push({
          topic: item.topic,
          category: item.category,
          tags: item.tags,
          reasoning: 'Successfully created'
        });
      } catch (err) {
        if (err.code === 11000) {
          duplicates++;
        } else {
          console.error(`[GenerateTopics] Failed to save topic "${item.topic}":`, err.message);
          details.push({
            topic: item.topic,
            category: item.category,
            error: err.message,
            reasoning: 'Failed to create'
          });
        }
      }
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    // Log cron run
    await CronLog.create({
      type: 'generate-topics',
      status: succeeded > 0 ? 'success' : 'failed',
      stats: { attempted: topics.length, succeeded, failed: topics.length - succeeded - duplicates, duplicates },
      details: details.map(d => ({
        topic: d.topic,
        category: d.category,
        tags: d.tags,
        error: d.error,
        reasoning: d.reasoning
      })),
      duration,
      triggeredBy: isManual ? 'manual' : 'cron',
      triggeredByUser: triggeredByUserId || undefined,
      startedAt,
      completedAt,
    });

    return NextResponse.json({
      success: true,
      stats: {
        attempted: topics.length,
        succeeded,
        duplicates,
        failed: topics.length - succeeded - duplicates
      }
    });

  } catch (error) {
    console.error('[GenerateTopics] Cron error:', error);
    
    // Log failure
    try {
      await dbConnect();
      await CronLog.create({
        type: 'generate-topics',
        status: 'failed',
        stats: { attempted: 0, succeeded: 0, failed: 0 },
        errorMessage: error.message,
        duration: Date.now() - startedAt.getTime(),
        triggeredBy: 'cron',
        startedAt,
        completedAt: new Date(),
      });
    } catch (logErr) {
      console.error('[GenerateTopics] Failed to log cron failure:', logErr);
    }

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Support GET for external schedulers
export async function GET(req) {
  return POST(req);
}
