import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Category from '@/models/Category';
import { getSession } from '@/lib/auth';
import { buildSeriesForCategory } from '@/lib/series';

export const maxDuration = 300;

async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user || user.role !== 'admin') return null;
  return user;
}

/**
 * POST /api/admin/series/generate
 * Body: { categoryId?: string, max?: number }
 * Builds AI learning paths from existing published posts. If categoryId is given,
 * builds one path for that category; otherwise sweeps categories (up to `max`, default 3).
 */
export async function POST(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));

    let categories;
    if (body.categoryId) {
      const c = await Category.findById(body.categoryId).lean();
      categories = c ? [c] : [];
    } else {
      categories = await Category.find({}).lean();
    }
    if (!categories.length) return NextResponse.json({ error: 'No category found' }, { status: 400 });

    const limit = body.categoryId ? 1 : (body.max || 3);
    const results = [];
    let made = 0;
    for (const cat of categories) {
      if (made >= limit) break;
      const res = await buildSeriesForCategory(cat, admin._id);
      results.push({
        category: cat.name,
        ...(res.created ? { created: res.created.title, id: res.created._id } : { skipped: res.skipped }),
      });
      if (res.created) made++;
    }

    return NextResponse.json({ success: true, made, results });
  } catch (error) {
    console.error('Admin series generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
