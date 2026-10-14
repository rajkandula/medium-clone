import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NewsArticle from '@/models/NewsArticle';
import { fetchAllSources } from '@/lib/newsFetcher';
import { filterArticle } from '@/lib/newsFilter';
import { getCronSecret } from '@/lib/cronAuth';

/**
 * POST /api/cron/fetch-news
 * Trigger the news curation pipeline.
 * Protected by a secret key (for an external scheduler or a manual trigger).
 */
export async function POST(req) {
  const startedAt = new Date();

  try {
    // Verify CRON secret — supports Authorization: Bearer, query param, or header
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

    // Check if pipeline is enabled
    const AutomationConfig = (await import('@/models/AutomationConfig')).default;
    const CronLog = (await import('@/models/CronLog')).default;

    // Global emergency stop — halts ALL pipelines (scheduled AND manual) until an admin resumes.
    const { isAutomationPaused } = await import('@/lib/automationGate');
    if (await isAutomationPaused()) {
      await CronLog.create({
        type: 'fetch-news', status: 'skipped',
        stats: { attempted: 0, succeeded: 0, failed: 0 },
        duration: Date.now() - startedAt.getTime(),
        triggeredBy: isManual ? 'manual' : 'cron', startedAt, completedAt: new Date(),
        errorMessage: 'All automation paused by admin',
      });
      return NextResponse.json({ skipped: true, reason: 'All automation is paused by admin' });
    }

    const config = await AutomationConfig.findOne({ type: 'fetch-news' });
    if (config && !config.enabled && !isManual) {
      await CronLog.create({
        type: 'fetch-news', status: 'skipped',
        stats: { attempted: 0, succeeded: 0, failed: 0 },
        duration: Date.now() - startedAt.getTime(),
        triggeredBy: 'cron', startedAt, completedAt: new Date(),
      });
      return NextResponse.json({ skipped: true, reason: 'Pipeline is paused' });
    }

    // 1. Fetch raw articles from RSS
    const rawArticles = await fetchAllSources();
    console.log(`[Pulse] Fetched ${rawArticles.length} raw articles from RSS`);

    let processed = 0;
    let approved = 0;
    let duplicates = 0;
    let filtered = 0;
    let errors = 0;
    const MAX_TO_PROCESS = config?.settings?.maxToProcess || 10;

    for (const article of rawArticles) {
      if (processed >= MAX_TO_PROCESS) {
        console.log(`[Pulse] Reached MAX_TO_PROCESS limit of ${MAX_TO_PROCESS}. Stopping curation loop.`);
        break;
      }

      if (!article.title || !article.link) continue;

      // 2. Check for duplicates
      const exists = await NewsArticle.findOne({ sourceUrl: article.link });
      if (exists) {
        duplicates++;
        continue;
      }

      // 3. Run LLM filter
      const filterResult = await filterArticle(article);
      processed++;

      // 4. Save to DB
      try {
        await NewsArticle.create({
          title: article.title,
          summary: filterResult.summary,
          keyTakeaways: filterResult.keyTakeaways,
          sourceUrl: article.link,
          sourceName: article.sourceName,
          sourceIcon: article.sourceIcon,
          imageUrl: article.imageUrl,
          topics: filterResult.topics,
          isApproved: filterResult.isApproved,
          rejectionReason: filterResult.rejectionReason,
          publishedAt: article.publishedAt,
        });

        if (filterResult.isApproved) approved++;
        else filtered++;
      } catch (saveErr) {
        // Duplicate key error (race condition)
        if (saveErr.code === 11000) duplicates++;
        else {
          errors++;
          console.error('Save error:', saveErr.message);
        }
      }
    }

    const completedAt = new Date();

    // Log execution
    await CronLog.create({
      type: 'fetch-news',
      status: errors > 0 ? 'partial' : 'success',
      stats: { attempted: processed, succeeded: approved, failed: errors, filtered, duplicates },
      duration: completedAt.getTime() - startedAt.getTime(),
      triggeredBy: isManual ? 'manual' : 'cron',
      triggeredByUser: triggeredByUserId || undefined,
      startedAt,
      completedAt,
    });

    // Update config
    if (config) {
      config.lastRunAt = completedAt;
      config.lastRunStatus = errors > 0 ? 'partial' : 'success';
      config.lastRunStats = { totalFetched: rawArticles.length, processed, approved, filtered, errors, duplicates };
      await config.save();
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalFetched: rawArticles.length,
        processed,
        approved,
        filtered,
        errors,
        duplicates,
      }
    });
  } catch (error) {
    console.error('[Pulse] CRON error:', error);
    try {
      const CronLog = (await import('@/models/CronLog')).default;
      await CronLog.create({
        type: 'fetch-news', status: 'failed',
        stats: { attempted: 0, succeeded: 0, failed: 0 },
        errorMessage: error.message,
        duration: Date.now() - startedAt.getTime(),
        triggeredBy: 'cron', startedAt, completedAt: new Date(),
      });
    } catch {}
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET for external schedulers
export async function GET(req) {
  return POST(req);
}

