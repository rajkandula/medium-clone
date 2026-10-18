import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Series from '@/models/Series';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';
import { createSlug } from '@/lib/utils';

// GET /api/series/[id] — detail by ObjectId or slug, with ordered published lessons
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const series = await Series.findOne(query)
      .populate('author', 'name username avatar')
      .populate('category', 'name slug color')
      .populate({
        path: 'posts',
        match: { status: 'published' },
        select: 'title slug excerpt coverImage readTime format appName appIcon isAiGenerated category',
        populate: { path: 'category', select: 'name slug color' },
      })
      .lean();

    if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });

    // Unpublished series are visible to their author and admins only.
    if (series.status !== 'published') {
      const viewer = await getSession();
      const authorId = (series.author?._id || series.author)?.toString();
      if (!viewer || (viewer.role !== 'admin' && viewer.userId !== authorId)) {
        return NextResponse.json({ error: 'Series not found' }, { status: 404 });
      }
    }

    // Drop unpublished/deleted lessons (populate match -> null), keep order.
    series.posts = (series.posts || []).filter(Boolean);

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Get series detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/series/[id] — update (author or admin)
export async function PUT(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    const series = await Series.findById(id);
    if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    if (series.author.toString() !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, coverImage, category, level, tags, posts, status } = body;

    if (title && title !== series.title) {
      series.title = title;
      let newSlug = createSlug(title);
      if (await Series.findOne({ slug: newSlug, _id: { $ne: series._id } })) {
        newSlug = `${newSlug}-${Date.now().toString(36)}`;
      }
      series.slug = newSlug;
    }
    if (description !== undefined) series.description = description;
    if (coverImage !== undefined) series.coverImage = coverImage;
    if (category !== undefined) series.category = category || null;
    if (level && ['beginner', 'intermediate', 'advanced'].includes(level)) series.level = level;
    if (Array.isArray(tags)) series.tags = tags;
    if (Array.isArray(posts)) {
      series.posts = posts;
      series.postCount = posts.length;
    }
    if (status) {
      const wasPublished = series.status === 'published';
      series.status = status;
      if (status === 'published' && !wasPublished) series.publishedAt = new Date();
    }

    await series.save();
    return NextResponse.json({ series });
  } catch (error) {
    console.error('Update series error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/series/[id] — delete (author or admin). No Post-side cleanup (membership is Series-only).
export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    const series = await Series.findById(id);
    if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    if (series.author.toString() !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Series.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete series error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
