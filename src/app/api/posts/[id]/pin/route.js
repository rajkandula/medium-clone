import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    // Verify ownership
    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (post.author.toString() !== session.userId) {
      return NextResponse.json({ error: 'Not your post' }, { status: 403 });
    }

    const user = await User.findById(session.userId);
    const pinnedIds = (user.pinnedPosts || []).map(p => p.toString());
    const isCurrentlyPinned = pinnedIds.includes(id);

    if (isCurrentlyPinned) {
      // Unpin
      await User.findByIdAndUpdate(session.userId, {
        $pull: { pinnedPosts: id }
      });
      await Post.findByIdAndUpdate(id, { isPinned: false });
      return NextResponse.json({ pinned: false, message: 'Post unpinned' });
    } else {
      // Check max 3 limit
      if (pinnedIds.length >= 3) {
        return NextResponse.json({ error: 'Maximum 3 pinned posts allowed' }, { status: 400 });
      }
      // Pin
      await User.findByIdAndUpdate(session.userId, {
        $addToSet: { pinnedPosts: id }
      });
      await Post.findByIdAndUpdate(id, { isPinned: true });
      return NextResponse.json({ pinned: true, message: 'Post pinned' });
    }
  } catch (error) {
    console.error('Pin toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
