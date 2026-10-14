import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ResearchPaper from '@/models/ResearchPaper';
import { fetchArxivPapers } from '@/lib/researchFetcher';
import { filterResearchPaper } from '@/lib/researchFilter';
import { getCronSecret } from '@/lib/cronAuth';

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
        type: 'fetch-research', status: 'skipped',
        stats: { attempted: 0, succeeded: 0, failed: 0 },
        duration: Date.now() - startedAt.getTime(),
        triggeredBy: isManual ? 'manual' : 'cron', startedAt, completedAt: new Date(),
        errorMessage: 'All automation paused by admin',
      });
      return NextResponse.json({ skipped: true, reason: 'All automation is paused by admin' });
    }

    const config = await AutomationConfig.findOne({ type: 'fetch-research' });
    if (config && !config.enabled && !isManual) {
      await CronLog.create({
        type: 'fetch-research', status: 'skipped',
        stats: { attempted: 0, succeeded: 0, failed: 0 },
        duration: Date.now() - startedAt.getTime(),
        triggeredBy: 'cron', startedAt, completedAt: new Date(),
      });
      return NextResponse.json({ skipped: true, reason: 'Pipeline is paused' });
    }

    // 1. Fetch raw papers
    const papers = await fetchArxivPapers();
    console.log(`[Research] Fetched ${papers.length} papers from arXiv`);

    let processed = 0;
    let newPapers = 0;
    let duplicates = 0;

    for (const paper of papers) {
      if (!paper.title || !paper.sourceUrl) continue;

      // 2. Check for duplicates
      const exists = await ResearchPaper.findOne({ sourceUrl: paper.sourceUrl });
      if (exists) {
        duplicates++;
        continue;
      }

      processed++;

      // 3. Generate AI summary and key takeaways
      let summary = '';
      let keyTakeaways = [];
      try {
        const filterResult = await filterResearchPaper({
          title: paper.title,
          abstract: paper.abstract,
        });
        summary = filterResult.summary;
        keyTakeaways = filterResult.keyTakeaways;
      } catch (aiErr) {
        console.error('[Research AI] Error curating insights:', aiErr.message);
      }

      // 4. Save to DB
      try {
        await ResearchPaper.create({
          title: paper.title,
          abstract: paper.abstract,
          authors: paper.authors,
          sourceUrl: paper.sourceUrl,
          sourceName: paper.sourceName,
          topics: paper.topics,
          summary,
          keyTakeaways,
          isApproved: true,
          publishedAt: paper.publishedAt,
        });
        newPapers++;
      } catch (saveErr) {
        if (saveErr.code === 11000) duplicates++;
        else console.error('Save error:', saveErr.message);
      }
    }

    const completedAt = new Date();

    // Log execution
    await CronLog.create({
      type: 'fetch-research',
      status: 'success',
      stats: { attempted: processed, succeeded: newPapers, failed: 0, duplicates },
      duration: completedAt.getTime() - startedAt.getTime(),
      triggeredBy: isManual ? 'manual' : 'cron',
      triggeredByUser: triggeredByUserId || undefined,
      startedAt,
      completedAt,
    });

    // Update config
    if (config) {
      config.lastRunAt = completedAt;
      config.lastRunStatus = 'success';
      config.lastRunStats = { totalFetched: papers.length, processed, newPapers, duplicates };
      await config.save();
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalFetched: papers.length,
        processed,
        newPapers,
        duplicates,
      }
    });
  } catch (error) {
    console.error('[Research] CRON error:', error);
    try {
      const CronLog = (await import('@/models/CronLog')).default;
      await CronLog.create({
        type: 'fetch-research', status: 'failed',
        stats: { attempted: 0, succeeded: 0, failed: 0 },
        errorMessage: error.message,
        duration: Date.now() - startedAt.getTime(),
        triggeredBy: 'cron', startedAt, completedAt: new Date(),
      });
    } catch {}
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Support GET for external schedulers
export async function GET(req) {
  return POST(req);
}

