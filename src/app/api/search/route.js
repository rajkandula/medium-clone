import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import User from '@/models/User';
import Category from '@/models/Category';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    if (!q || q.length < 2) {
      return NextResponse.json({ posts: [], total: 0 });
    }

    const filter = {
      status: 'published',
      $text: { $search: q },
    };

    const [posts, total] = await Promise.all([
      Post.find(filter, { score: { $meta: 'textScore' }, content: 0 })
        .populate('author', 'name username avatar')
        .populate('category', 'name slug color')
        .sort({ score: { $meta: 'textScore' } })
        .skip((page - 1) * limit).limit(limit).lean(),
      Post.countDocuments(filter),
    ]);

    return NextResponse.json({ posts, total, page, hasMore: page * limit < total });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
