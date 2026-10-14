import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import ContactMessage from '@/models/ContactMessage';
import Feedback from '@/models/Feedback';
import { getSession } from '@/lib/auth';

async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user || user.role !== 'admin') return null;
  return user;
}

// GET /api/admin — Retrieve management stats & lists
export async function GET(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'stats';

    if (type === 'stats') {
      const [
        totalUsers,
        totalPosts,
        totalComments,
        writerUsers,
        totalFeedback,
        totalContacts,
        recentUsers,
        feedbackRatings
      ] = await Promise.all([
        User.countDocuments(),
        Post.countDocuments({ status: 'published' }),
        Comment.countDocuments(),
        User.countDocuments({ 'subscription.plan': 'writer' }),
        Feedback.countDocuments(),
        ContactMessage.countDocuments(),
        User.find().sort({ createdAt: -1 }).limit(5).select('name email username avatar createdAt subscription').lean(),
        Feedback.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' } } }])
      ]);

      const avgRating = feedbackRatings[0]?.avgRating ? parseFloat(feedbackRatings[0].avgRating.toFixed(1)) : 0;

      return NextResponse.json({
        totalUsers,
        totalPosts,
        totalComments,
        writerUsers,
        totalFeedback,
        totalContacts,
        avgRating,
        recentUsers,
        revenue: writerUsers * 1.00 // $1/mo per writer subscription
      });
    }

    if (type === 'users') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';

      const filter = search ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { username: { $regex: search, $options: 'i' } }] } : {};
      const [users, total] = await Promise.all([
        User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        User.countDocuments(filter),
      ]);
      return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
    }

    if (type === 'posts') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status');

      const filter = status ? { status } : {};
      const [posts, total] = await Promise.all([
        Post.find(filter).populate('author', 'name username avatar').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Post.countDocuments(filter),
      ]);
      return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
    }

    if (type === 'contacts') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '15');
      const showArchived = searchParams.get('archived') === 'true';

      const filter = { isArchived: showArchived };
      const [messages, total] = await Promise.all([
        ContactMessage.find(filter)
          .populate('recipient', 'name username')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        ContactMessage.countDocuments(filter),
      ]);
      return NextResponse.json({ messages, total, page, totalPages: Math.ceil(total / limit) });
    }

    if (type === 'billing') {
      const payingUsers = await User.find({ 'subscription.plan': 'writer' })
        .select('name email username subscription createdAt')
        .sort({ 'subscription.currentPeriodEnd': -1 })
        .lean();

      // Generate a list of simulated recent transactions for dashboard visuals
      const simulatedInvoices = payingUsers.map((u, i) => ({
        id: `inv_sim_${u._id.toString().substring(18)}_${i}`,
        user: u,
        amount: 1.00,
        currency: 'usd',
        status: 'paid',
        date: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString()
      }));

      return NextResponse.json({
        totalSubscribers: payingUsers.length,
        mrr: payingUsers.length * 1.00,
        subscribers: payingUsers,
        invoices: simulatedInvoices
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin — Modify records or perform admin actions
export async function PUT(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { action, userId, postId, contactId, feedbackId, data } = await req.json();

    if (action === 'updateUser' && userId) {
      // Whitelist the fields an admin may change — never persist the raw request body,
      // which could otherwise set subscription.plan, tokenVersion, email, googleId, etc.
      const patch = {};
      if (data?.role && ['user', 'admin'].includes(data.role)) patch.role = data.role;
      if (typeof data?.isVerified === 'boolean') patch.isVerified = data.isVerified;
      if (Object.keys(patch).length === 0) {
        return NextResponse.json({ error: 'No permitted fields to update' }, { status: 400 });
      }

      // Prevent locking every admin out: block self-demotion and demoting the last admin.
      if (patch.role === 'user') {
        if (userId === admin._id.toString()) {
          return NextResponse.json({ error: 'You cannot remove your own admin role.' }, { status: 400 });
        }
        const target = await User.findById(userId).select('role');
        if (target?.role === 'admin' && (await User.countDocuments({ role: 'admin' })) <= 1) {
          return NextResponse.json({ error: 'Cannot demote the last remaining admin.' }, { status: 400 });
        }
      }

      const user = await User.findByIdAndUpdate(userId, patch, { new: true }).select('-passwordHash');
      return NextResponse.json({ user });
    }

    if (action === 'featurePost' && postId) {
      const post = await Post.findByIdAndUpdate(postId, { isFeatured: data?.isFeatured ?? true }, { new: true });
      return NextResponse.json({ post });
    }

    if (action === 'deletePost' && postId) {
      await Post.findByIdAndDelete(postId);
      return NextResponse.json({ success: true });
    }

    if (action === 'updateContact' && contactId) {
      // Only the read/archive flags are admin-mutable — never the raw body.
      const patch = {};
      if (data && 'isRead' in data) patch.isRead = !!data.isRead;
      if (data && 'isArchived' in data) patch.isArchived = !!data.isArchived;
      const msg = await ContactMessage.findByIdAndUpdate(contactId, patch, { new: true });
      return NextResponse.json({ message: msg });
    }

    if (action === 'deleteContact' && contactId) {
      await ContactMessage.findByIdAndDelete(contactId);
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteFeedback' && feedbackId) {
      await Feedback.findByIdAndDelete(feedbackId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

