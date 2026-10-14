import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';
import { getSession } from '@/lib/auth';

/**
 * GET /api/contact/inbox
 * Fetch all contact messages for the logged-in user.
 */
export async function GET(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const filter = searchParams.get('filter') || 'all'; // all | unread | archived

    const query = { recipient: session.userId };
    if (filter === 'unread') {
      query.isRead = false;
      query.isArchived = false;
    } else if (filter === 'archived') {
      query.isArchived = true;
    } else {
      query.isArchived = false;
    }

    const [messages, total, unread] = await Promise.all([
      ContactMessage.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ContactMessage.countDocuments(query),
      ContactMessage.countDocuments({ recipient: session.userId, isRead: false, isArchived: false }),
    ]);

    return NextResponse.json({ messages, total, unread, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Inbox API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/contact/inbox
 * Mark messages as read or archive them.
 * Body: { messageIds: [...], action: 'read' | 'archive' | 'unarchive' }
 */
export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const body = await req.json();
    const { messageIds, action } = body;

    if (!messageIds?.length || !action) {
      return NextResponse.json({ error: 'messageIds and action required' }, { status: 400 });
    }

    const filter = { _id: { $in: messageIds }, recipient: session.userId };

    if (action === 'read') {
      await ContactMessage.updateMany(filter, { isRead: true });
    } else if (action === 'archive') {
      await ContactMessage.updateMany(filter, { isArchived: true, isRead: true });
    } else if (action === 'unarchive') {
      await ContactMessage.updateMany(filter, { isArchived: false });
    } else if (action === 'read_all') {
      await ContactMessage.updateMany({ recipient: session.userId, isRead: false }, { isRead: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inbox update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
