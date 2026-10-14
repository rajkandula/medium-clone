import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';

export async function GET() {
  try {
    await dbConnect();
    
    const [totalUsers, totalPosts, viewStats] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments({ status: 'published' }),
      Post.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
      ])
    ]);
    
    const totalViews = viewStats[0]?.totalViews || 0;
    
    return NextResponse.json({
      activeWriters: totalUsers,
      storiesPublished: totalPosts,
      monthlyReaders: totalViews,
    });
  } catch (err) {
    console.error('[STATS API] Error fetching stats:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
