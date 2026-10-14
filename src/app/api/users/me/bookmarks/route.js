import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Bookmark from '@/models/Bookmark';
import Post from '@/models/Post';
import User from '@/models/User';
import ResearchPaper from '@/models/ResearchPaper';
import NewsArticle from '@/models/NewsArticle';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'post' | 'research' | 'news' | null (all)

    const query = { user: session.userId };
    if (type && ['post', 'research', 'news'].includes(type)) {
      query.itemType = type;
    }

    const bookmarks = await Bookmark.find(query)
      .populate({ path: 'post', populate: { path: 'author', select: 'name username avatar' } })
      .populate('research')
      .populate('news')
      .sort({ createdAt: -1 })
      .lean();

    // Filter out bookmarks where the referenced item was deleted
    const valid = bookmarks.filter(b => {
      if (b.itemType === 'post') return !!b.post;
      if (b.itemType === 'research') return !!b.research;
      if (b.itemType === 'news') return !!b.news;
      // Legacy bookmarks (no itemType) — treat as post
      return !!b.post;
    });

    // Normalize legacy bookmarks that don't have itemType
    const normalized = valid.map(b => ({
      ...b,
      itemType: b.itemType || 'post',
    }));

    return NextResponse.json({ bookmarks: normalized });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
