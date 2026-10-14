import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Series from '@/models/Series';
import Category from '@/models/Category';
import { getSession } from '@/lib/auth';
import { createSlug } from '@/lib/utils';

// GET /api/series — list learning paths (public, paginated)
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const status = searchParams.get('status') || 'published';
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const tag = searchParams.get('tag');

    const filter = { status };
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (tag) filter.tags = tag;

    const skip = (page - 1) * limit;
    const [series, total] = await Promise.all([
      Series.find(filter)
        .populate('author', 'name username avatar')
        .populate('category', 'name slug color')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Series.countDocuments(filter),
    ]);

    return NextResponse.json({
      series, total, page, limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + series.length < total,
    });
  } catch (error) {
    console.error('Get series error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/series — create a learning path
export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const body = await req.json();
    const { title, description, coverImage, category, level, tags, posts, status } = body;

    if (!title || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: 'Title and a non-empty posts array are required' }, { status: 400 });
    }

    // Resolve category name/slug/id -> ObjectId (mirrors posts route)
    let resolvedCategoryId = null;
    if (category) {
      const inputStr = String(category).trim();
      if (inputStr) {
        if (mongoose.isValidObjectId(inputStr)) {
          resolvedCategoryId = inputStr;
        } else {
          const cat = await Category.findOne({
            $or: [
              { name: { $regex: new RegExp(`^${inputStr}$`, 'i') } },
              { slug: inputStr.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
            ],
          });
          if (cat) resolvedCategoryId = cat._id;
        }
      }
    }

    let slug = createSlug(title);
    if (await Series.findOne({ slug })) slug = `${slug}-${Date.now().toString(36)}`;

    const series = await Series.create({
      title,
      slug,
      description: description || '',
      coverImage: coverImage || null,
      author: session.userId,
      category: resolvedCategoryId,
      level: ['beginner', 'intermediate', 'advanced'].includes(level) ? level : 'beginner',
      tags: Array.isArray(tags) ? tags : [],
      posts,
      postCount: posts.length,
      status: status || 'draft',
      isAiGenerated: false,
      publishedAt: status === 'published' ? new Date() : null,
    });

    return NextResponse.json({ series }, { status: 201 });
  } catch (error) {
    console.error('Create series error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
