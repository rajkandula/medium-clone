import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import CronLog from '@/models/CronLog';
import { getSession } from '@/lib/auth';

async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user || user.role !== 'admin') return null;
  return user;
}

/**
 * GET /api/admin/automation/logs — Paginated execution logs
 */
export async function GET(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'generate-posts', 'fetch-news', 'fetch-research'
    const status = searchParams.get('status'); // 'success', 'partial', 'failed', 'skipped'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const [logs, total] = await Promise.all([
      CronLog.find(filter)
        .populate('triggeredByUser', 'name username avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CronLog.countDocuments(filter),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
