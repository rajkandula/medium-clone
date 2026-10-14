import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/siteUrl';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { getCronSecret } from '@/lib/cronAuth';

async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user || user.role !== 'admin') return null;
  return user;
}

/**
 * POST /api/admin/automation/trigger — Manually trigger a pipeline
 */
export async function POST(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { type } = await req.json();
    if (!type) return NextResponse.json({ error: 'Type required' }, { status: 400 });

    // Block manual runs while the global emergency stop is engaged.
    const { isAutomationPaused } = await import('@/lib/automationGate');
    if (await isAutomationPaused()) {
      return NextResponse.json({ error: 'All automation is paused. Resume it before running a pipeline.' }, { status: 409 });
    }

    // Build the internal URL to the cron endpoint
    const cronPaths = {
      'generate-posts': '/api/cron/generate-posts',
      'fetch-news': '/api/cron/fetch-news',
      'fetch-research': '/api/cron/fetch-research',
      'generate-topics': '/api/cron/generate-topics',
      'generate-series': '/api/cron/generate-series',
    };

    const path = cronPaths[type];
    if (!path) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    // Call the cron endpoint internally with the secret + manual flag
    const secret = getCronSecret();
    const response = await fetch(`${SITE_URL}${path}?manual=true`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json',
        'x-triggered-by': admin._id.toString(),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: result.error || 'Trigger failed' }, { status: response.status });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Admin trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
