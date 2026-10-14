import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import AutomationConfig from '@/models/AutomationConfig';
import CronLog from '@/models/CronLog';
import { getSession } from '@/lib/auth';
import { getAutomationState, setAutomationPaused } from '@/lib/automationGate';

async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user || user.role !== 'admin') return null;
  return user;
}

/**
 * GET /api/admin/automation — Fetch all automation configs + recent stats
 */
export async function GET(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Ensure default configs exist
    await AutomationConfig.ensureDefaults();

    const configs = await AutomationConfig.find({}).sort({ type: 1 }).lean();

    // Get stats for each pipeline
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now - 7 * 24 * 3600000);

    const automationState = await getAutomationState();

    const [todayStats, weekStats, recentLogs] = await Promise.all([
      // Today's stats per type
      CronLog.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: {
          _id: '$type',
          runs: { $sum: 1 },
          succeeded: { $sum: '$stats.succeeded' },
          failed: { $sum: '$stats.failed' },
        }},
      ]),
      // Week stats per type
      CronLog.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: {
          _id: '$type',
          runs: { $sum: 1 },
          succeeded: { $sum: '$stats.succeeded' },
          failed: { $sum: '$stats.failed' },
          avgDuration: { $avg: '$duration' },
        }},
      ]),
      // Recent logs (latest 15)
      CronLog.find({})
        .sort({ createdAt: -1 })
        .limit(15)
        .lean(),
    ]);

    // Build stats map
    const todayMap = {};
    todayStats.forEach(s => { todayMap[s._id] = s; });
    const weekMap = {};
    weekStats.forEach(s => { weekMap[s._id] = s; });

    // Enrich configs with stats
    const enriched = configs.map(c => ({
      ...c,
      todayStats: todayMap[c.type] || { runs: 0, succeeded: 0, failed: 0 },
      weekStats: weekMap[c.type] || { runs: 0, succeeded: 0, failed: 0, avgDuration: 0 },
    }));

    return NextResponse.json({
      configs: enriched,
      recentLogs,
      automationPaused: !!automationState.paused,
      pausedAt: automationState.pausedAt || null,
    });
  } catch (error) {
    console.error('Admin automation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/automation — Global emergency stop / resume for ALL pipelines.
 * Body: { action: 'pause-all' | 'resume-all' }
 */
export async function POST(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { action } = await req.json();
    if (action !== 'pause-all' && action !== 'resume-all') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const paused = action === 'pause-all';
    const state = await setAutomationPaused(paused, admin._id);

    return NextResponse.json({
      automationPaused: !!state.paused,
      pausedAt: state.pausedAt || null,
    });
  } catch (error) {
    console.error('Admin automation pause error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/automation — Update a pipeline config (enable/disable, settings)
 */
export async function PUT(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { type, enabled, settings } = await req.json();
    if (!type) return NextResponse.json({ error: 'Type required' }, { status: 400 });

    const update = {};
    if (typeof enabled === 'boolean') update.enabled = enabled;
    if (settings) update.settings = settings;

    const config = await AutomationConfig.findOneAndUpdate(
      { type },
      update,
      { new: true }
    );

    if (!config) return NextResponse.json({ error: 'Config not found' }, { status: 404 });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Admin automation update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
