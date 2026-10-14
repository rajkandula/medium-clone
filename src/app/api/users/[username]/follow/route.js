import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Follow from '@/models/Follow';
import Notification from '@/models/Notification';
import { getSession } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { username } = await params;
    const targetUser = await User.findOne({ username });
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (targetUser._id.toString() === session.userId) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

    const existing = await Follow.findOne({ follower: session.userId, following: targetUser._id });

    if (existing) {
      await Follow.findByIdAndDelete(existing._id);
      await User.findByIdAndUpdate(session.userId, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(targetUser._id, { $inc: { followersCount: -1 } });
      return NextResponse.json({ following: false });
    } else {
      await Follow.create({ follower: session.userId, following: targetUser._id });
      await User.findByIdAndUpdate(session.userId, { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(targetUser._id, { $inc: { followersCount: 1 } });
      
      Notification.create({ recipient: targetUser._id, actor: session.userId, type: 'follow' }).catch(() => {});
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
