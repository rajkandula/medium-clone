import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import Like from '@/models/Like';
import Notification from '@/models/Notification';
import { getSession } from '@/lib/auth';

// POST /api/posts/[id]/like — Toggle like
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

    const existing = await Like.findOne({ user: session.userId, post: id });

    if (existing) {
      await Like.findByIdAndDelete(existing._id);
      const post = await Post.findByIdAndUpdate(id, { $inc: { likesCount: -1 } }, { new: true });
      return NextResponse.json({ liked: false, likesCount: post?.likesCount || 0 });
    } else {
      await Like.create({ user: session.userId, post: id });
      const post = await Post.findByIdAndUpdate(id, { $inc: { likesCount: 1 } }, { new: true });
      // Create notification (don't notify self)
      if (post && post.author.toString() !== session.userId) {
        Notification.create({
          recipient: post.author, actor: session.userId,
          type: 'like', post: id,
        }).catch(() => { });
      }
      return NextResponse.json({ liked: true, likesCount: post?.likesCount || 0 });
    }
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
