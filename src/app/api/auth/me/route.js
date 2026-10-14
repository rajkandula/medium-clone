import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.userId).select('-passwordHash');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id, name: user.name, email: user.email, username: user.username,
        avatar: user.avatar, bio: user.bio, about: user.about, interests: user.interests,
        socialLinks: user.socialLinks, role: user.role, subscription: user.subscription,
        followersCount: user.followersCount, followingCount: user.followingCount,
        postsCount: user.postsCount, preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
