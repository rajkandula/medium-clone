import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NewsArticle from '@/models/NewsArticle';
import Bookmark from '@/models/Bookmark';
import { getSession } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    // Verify article exists
    const article = await NewsArticle.findById(id).select('_id').lean();
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    const existing = await Bookmark.findOne({
      user: session.userId,
      itemType: 'news',
      news: id,
    });

    if (existing) {
      await Bookmark.findByIdAndDelete(existing._id);
      await NewsArticle.findByIdAndUpdate(id, { $inc: { savedCount: -1 } });
      return NextResponse.json({ saved: false });
    } else {
      await Bookmark.create({
        user: session.userId,
        itemType: 'news',
        news: id,
      });
      await NewsArticle.findByIdAndUpdate(id, { $inc: { savedCount: 1 } });
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('News save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET — check if current user has saved this article
export async function GET(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ saved: false });

    await dbConnect();
    const { id } = await params;

    const existing = await Bookmark.findOne({
      user: session.userId,
      itemType: 'news',
      news: id,
    });

    return NextResponse.json({ saved: !!existing });
  } catch {
    return NextResponse.json({ saved: false });
  }
}
