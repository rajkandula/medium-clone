import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import Bookmark from '@/models/Bookmark';
import { getSession } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    let { id } = await params;

    // Resolve slug to ObjectId if needed
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      const found = await Post.findOne({ slug: id }).select('_id').lean();
      if (!found) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      id = found._id.toString();
    }

    const existing = await Bookmark.findOne({
      user: session.userId,
      post: id,
      $or: [{ itemType: 'post' }, { itemType: { $exists: false } }],
    });

    if (existing) {
      await Bookmark.findByIdAndDelete(existing._id);
      await Post.findByIdAndUpdate(id, { $inc: { bookmarksCount: -1 } });
      return NextResponse.json({ bookmarked: false });
    } else {
      await Bookmark.create({
        user: session.userId,
        itemType: 'post',
        post: id,
      });
      await Post.findByIdAndUpdate(id, { $inc: { bookmarksCount: 1 } });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error('Bookmark error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
