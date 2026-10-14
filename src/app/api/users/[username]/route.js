import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';
import Follow from '@/models/Follow';
import Category from '@/models/Category';
import { getSession } from '@/lib/auth';

// GET /api/users/[username]
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { username } = await params;
    const user = await User.findOne({ username }).select('-passwordHash').lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Check if viewer is the profile owner
    let isOwner = false;
    let session = null;
    try {
      session = await getSession();
      if (session && session.userId === user._id.toString()) {
        isOwner = true;
      }
    } catch {}

    // Owner sees all posts (including drafts); visitors see only published
    const postFilter = isOwner
      ? { author: user._id }
      : { author: user._id, status: 'published' };
    const posts = await Post.find(postFilter)
      .populate('category', 'name slug color')
      .sort({ publishedAt: -1, createdAt: -1 }).limit(50).lean();

    let isFollowing = false;
    if (session && !isOwner) {
      const follow = await Follow.findOne({ follower: session.userId, following: user._id });
      isFollowing = !!follow;
    }

    return NextResponse.json({ user, posts, isFollowing });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
