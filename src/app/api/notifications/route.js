import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import ContactMessage from '@/models/ContactMessage';
import User from '@/models/User';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const [notifications, total, unread] = await Promise.all([
      Notification.find({ recipient: session.userId })
        .populate('actor', 'name username avatar')
        .populate('post', 'title slug')
        .populate('contactMessage', 'senderName senderEmail subject message createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments({ recipient: session.userId }),
      Notification.countDocuments({ recipient: session.userId, isRead: false }),
    ]);

    return NextResponse.json({ notifications, total, unread, page });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // Body is empty or not JSON, which is fine
    }

    const { id } = body;
    if (id) {
      await Notification.updateOne({ _id: id, recipient: session.userId }, { isRead: true });
    } else {
      await Notification.updateMany({ recipient: session.userId, isRead: false }, { isRead: true });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update notification status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
