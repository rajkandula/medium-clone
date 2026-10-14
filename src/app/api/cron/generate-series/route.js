import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Category from '@/models/Category';
import Post from '@/models/Post';
import Series from '@/models/Series';
import CronLog from '@/models/CronLog';
import AutomationConfig from '@/models/AutomationConfig';
import { getCronSecret } from '@/lib/cronAuth';
import { buildSeriesForCategory } from '@/lib/series';

export const maxDuration = 300;

const MIN_POOL = 6;

/**
 * POST /api/cron/generate-series
 * Groups existing published posts into ordered beginner->advanced learning paths,
 * one per eligible category, up to settings.maxSeriesPerRun.
 */
export async function POST(req) {
  const startedAt = new Date();
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '') || searchParams.get('secret') || req.headers.get('x-cron-secret');
    if (secret !== getCronSecret()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isManual = searchParams.get('manual') === 'true';
    const triggeredByUserId = req.headers.get('x-triggered-by') || null;

    await dbConnect();

    // Global emergency stop — halts ALL pipelines (scheduled AND manual) until an admin resumes.
    const { isAutomationPaused } = await import('@/lib/automationGate');
    if (await isAutomationPaused()) {
      await CronLog.create({
        type: 'generate-series', status: 'skipped',
        stats: { attempted: 0, succeeded: 0, failed: 0 }, details: [],
        duration: Date.now() - startedAt.getTime(),
        triggeredBy: isManual ? 'manual' : 'cron', startedAt, completedAt: new Date(),
        errorMessage: 'All automation paused by admin',
      });
      return NextResponse.json({ skipped: true, reason: 'All automation is paused by admin' });
    }

    const config = await AutomationConfig.findOne({ type: 'generate-series' });
    if (config && !config.enabled && !isManual) {
      await CronLog.create({
        type: 'generate-series', status: 'skipped',
        stats: { attempted: 0, succeeded: 0, failed: 0 }, details: [],
        duration: Date.now() - startedAt.getTime(), triggeredBy: 'cron', startedAt, completedAt: new Date(),
      });
      return NextResponse.json({ skipped: true, reason: 'Pipeline is paused' });
    }

    const adminEmail = process.env.ADMIN_EMAILS?.split(',')[0]?.trim();
    const author =
      (await User.findOne({ email: adminEmail })) ||
      (await User.findOne({ role: 'admin' })) ||
      (await User.findOne({}));
    if (!author) return NextResponse.json({ error: 'No author found' }, { status: 500 });

    const maxSeries = config?.settings?.maxSeriesPerRun || 3;

    const categories = await Category.find({}).lean();
    const details = [];
    let succeeded = 0, failed = 0, attempted = 0;

    for (const cat of categories) {
      if (succeeded >= maxSeries) break;

      const publishedCount = await Post.countDocuments({ category: cat._id, status: 'published' });
      if (publishedCount < MIN_POOL) continue;
      const already = await Series.findOne({ category: cat._id, isAiGenerated: true });
      if (already) continue;

      attempted++;
      try {
        const res = await buildSeriesForCategory(cat, author._id);
        if (res.created) {
          succeeded++;
          details.push({
            topic: `Learning Path: ${cat.name}`, title: res.created.title, postId: res.created._id,
            category: cat.name, reasoning: `Built a ${res.created.postCount}-part path from existing posts.`,
          });
        } else {
          details.push({ topic: `Learning Path: ${cat.name}`, category: cat.name, reasoning: `Skipped — ${res.skipped}` });
        }
      } catch (err) {
        failed++;
        details.push({ topic: `Learning Path: ${cat.name}`, category: cat.name, error: err.message, reasoning: `Failed — ${err.message}` });
      }
    }

    const completedAt = new Date();
    const status = failed === 0 ? 'success' : succeeded === 0 ? 'failed' : 'partial';
    await CronLog.create({
      type: 'generate-series', status,
      stats: { attempted, succeeded, failed }, details,
      duration: completedAt.getTime() - startedAt.getTime(),
      triggeredBy: isManual ? 'manual' : 'cron',
      triggeredByUser: triggeredByUserId || undefined,
      startedAt, completedAt,
    });

    if (config) {
      config.lastRunAt = completedAt;
      config.lastRunStatus = status;
      config.lastRunStats = { attempted, succeeded, failed };
      await config.save();
    }

    return NextResponse.json({ success: true, stats: { attempted, succeeded, failed }, series: details });
  } catch (error) {
    console.error('[GenerateSeries] error:', error);
    try {
      await CronLog.create({
        type: 'generate-series', status: 'failed',
        stats: { attempted: 0, succeeded: 0, failed: 0 }, errorMessage: error.message,
        duration: Date.now() - startedAt.getTime(), triggeredBy: 'cron', startedAt, completedAt: new Date(),
      });
    } catch {}
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Support GET for external schedulers
export async function GET(req) {
  return POST(req);
}
