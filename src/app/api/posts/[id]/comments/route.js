import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getSession } from '@/lib/auth';

// GET /api/posts/[id]/comments
export async function GET(req, { params }) {
  try {
    await dbConnect();
    let { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Resolve slug to ObjectId if needed
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (!isObjectId) {
      const post = await Post.findOne({ slug: id }).select('_id').lean();
      if (!post) return NextResponse.json({ comments: [], total: 0 });
      id = post._id.toString();
    }

    const [comments, total] = await Promise.all([
      Comment.find({ post: id, parentComment: null })
        .populate('author', 'name username avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(limit).lean(),
      Comment.countDocuments({ post: id, parentComment: null }),
    ]);

    // Load replies for each comment
    const commentIds = comments.map(c => c._id);
    const replies = await Comment.find({ parentComment: { $in: commentIds } })
      .populate('author', 'name username avatar')
      .sort({ createdAt: 1 }).lean();

    const commentsWithReplies = comments.map(c => ({
      ...c, replies: replies.filter(r => r.parentComment.toString() === c._id.toString()),
    }));

    return NextResponse.json({ comments: commentsWithReplies, total, page, hasMore: page * limit < total });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/posts/[id]/comments
export async function POST(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    let { id } = await params;
    const { content, parentComment } = await req.json();

    if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

    // Resolve slug to ObjectId if needed
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (!isObjectId) {
      const post = await Post.findOne({ slug: id }).select('_id').lean();
      if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      id = post._id.toString();
    }

    const comment = await Comment.create({
      content: content.trim(), author: session.userId, post: id,
      parentComment: parentComment || null,
    });

    await Post.findByIdAndUpdate(id, { $inc: { commentsCount: 1 } });

    const post = await Post.findById(id);
    if (post.author.toString() !== session.userId) {
      Notification.create({
        recipient: post.author, actor: session.userId,
        type: 'comment', post: id, comment: comment._id,
      }).catch(() => {});
    }

    const populated = await Comment.findById(comment._id).populate('author', 'name username avatar').lean();
    return NextResponse.json({ comment: populated }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/posts/[id]/comments
export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    let { id } = await params;
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Resolve slug to ObjectId if needed
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (!isObjectId) {
      const post = await Post.findOne({ slug: id }).select('_id').lean();
      if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      id = post._id.toString();
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check ownership: must be the author of the comment
    if (comment.author.toString() !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let deleteCount = 1;
    if (!comment.parentComment) {
      // It's a parent comment. We also delete its replies.
      const replies = await Comment.find({ parentComment: comment._id }).select('_id').lean();
      const replyIds = replies.map(r => r._id);
      deleteCount += replyIds.length;

      // Delete replies and parent comment
      await Comment.deleteMany({ parentComment: comment._id });
      await Comment.deleteOne({ _id: comment._id });

      // Clean up notifications for both parent and replies
      await Notification.deleteMany({ comment: { $in: [comment._id, ...replyIds] } });
    } else {
      // It's a reply
      await Comment.deleteOne({ _id: comment._id });
      // Clean up notification
      await Notification.deleteMany({ comment: comment._id });
    }

    // Decrement commentsCount on Post
    await Post.findByIdAndUpdate(id, { $inc: { commentsCount: -deleteCount } });

    return NextResponse.json({ message: 'Comment deleted successfully', deletedCount: deleteCount });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

