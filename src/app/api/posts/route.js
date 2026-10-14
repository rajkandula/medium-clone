import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import User from '@/models/User';
import Category from '@/models/Category';
import Follow from '@/models/Follow';
import Notification from '@/models/Notification';
import Like from '@/models/Like';
import Bookmark from '@/models/Bookmark';
import { getSession } from '@/lib/auth';
import { estimateReadTime, createSlug } from '@/lib/utils';

// GET /api/posts — List posts (public, paginated)
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const status = searchParams.get('status') || 'published';
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const author = searchParams.get('author');
    const sort = searchParams.get('sort') || 'latest';

    const collection = searchParams.get('collection');

    const filter = { status };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (author) filter.author = author;
    if (collection) filter.collections = collection;

    let sortObj = { publishedAt: -1 };
    if (status === 'draft') sortObj = { createdAt: -1 };
    if (status === 'archived') sortObj = { updatedAt: -1 };

    if (sort === 'popular') sortObj = { viewCount: -1 };
    if (sort === 'trending') sortObj = { likesCount: -1, publishedAt: -1 };

    const skip = (page - 1) * limit;
    let [posts, total] = await Promise.all([
      Post.find(filter).select('-content').populate('author', 'name username avatar').populate('category', 'name slug color')
        .sort(sortObj).skip(skip).limit(limit).lean(),
      Post.countDocuments(filter),
    ]);

    // Enrich posts with userLiked and userBookmarked status
    try {
      const session = await getSession();
      if (session) {
        const postIds = posts.map(p => p._id);
        const [likedPostIds, bookmarkedPostIds] = await Promise.all([
          Like.find({ user: session.userId, post: { $in: postIds } }).distinct('post'),
          Bookmark.find({ user: session.userId, itemType: 'post', post: { $in: postIds } }).distinct('post')
        ]);
        const likedSet = new Set(likedPostIds.map(id => id.toString()));
        const bookmarkedSet = new Set(bookmarkedPostIds.map(id => id.toString()));
        posts = posts.map(p => ({
          ...p,
          userLiked: likedSet.has(p._id.toString()),
          userBookmarked: bookmarkedSet.has(p._id.toString())
        }));
      }
    } catch (e) {
      console.error('Error enriching posts:', e);
    }

    return NextResponse.json({
      posts, total,
      page, limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/posts — Create post
export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const body = await req.json();
    const { title, content, excerpt, coverImage, category, tags, status: postStatus, seoTitle, seoDescription, isAiGenerated, format, productUrl, appName, pricing, launchDate, appDescription, appImages, appIcon } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Resolve category name/slug/id safely to an ObjectId
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
              { slug: inputStr.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
            ]
          });
          if (cat) {
            resolvedCategoryId = cat._id;
          } else {
            const techCat = await Category.findOne({ name: { $regex: /^Tech(nology)?$/i } });
            resolvedCategoryId = techCat ? techCat._id : null;
          }
        }
      }
    }

    // Generate unique slug
    let slug = createSlug(title);
    const existingSlug = await Post.findOne({ slug });
    if (existingSlug) slug = `${slug}-${Date.now().toString(36)}`;

    const readTime = estimateReadTime(content);
    const finalStatus = postStatus || 'draft';

    // Check if a draft post with the same title already exists for this author
    // If it does, update/publish the draft instead of creating a duplicate post.
    const escapedTitle = title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingDraft = await Post.findOne({
      author: session.userId,
      title: { $regex: new RegExp(`^${escapedTitle}$`, 'i') },
      status: 'draft'
    });

    let post;
    if (existingDraft) {
      existingDraft.content = content;
      existingDraft.excerpt = excerpt || existingDraft.excerpt;
      existingDraft.coverImage = coverImage !== undefined ? coverImage : existingDraft.coverImage;
      existingDraft.category = resolvedCategoryId || existingDraft.category;
      existingDraft.tags = tags || existingDraft.tags;
      existingDraft.status = finalStatus;
      existingDraft.readTime = readTime;
      if (seoTitle !== undefined) existingDraft.seoTitle = seoTitle;
      if (seoDescription !== undefined) existingDraft.seoDescription = seoDescription;
      existingDraft.format = format || existingDraft.format;
      if (productUrl !== undefined) existingDraft.productUrl = productUrl;
      if (appName !== undefined) existingDraft.appName = appName;
      if (pricing !== undefined) existingDraft.pricing = pricing;
      if (launchDate !== undefined) existingDraft.launchDate = launchDate || null;
      if (appDescription !== undefined) existingDraft.appDescription = appDescription;
      if (appImages !== undefined) existingDraft.appImages = appImages;
      if (appIcon !== undefined) existingDraft.appIcon = appIcon;
      
      if (finalStatus === 'published') {
        existingDraft.publishedAt = new Date();
      }
      
      await existingDraft.save();
      post = existingDraft;
    } else {
      post = await Post.create({
        title, slug, content, excerpt, coverImage,
        author: session.userId, category: resolvedCategoryId, tags: tags || [],
        status: finalStatus, readTime, seoTitle, seoDescription,
        isAiGenerated: isAiGenerated || false,
        format: format || 'richtext',
        productUrl, appName, pricing, launchDate: launchDate || undefined,
        appDescription, appImages: appImages || [], appIcon,
        publishedAt: finalStatus === 'published' ? new Date() : null,
      });
    }

    // Update user post count & notify followers
    if (finalStatus === 'published') {
      await User.findByIdAndUpdate(session.userId, { $inc: { postsCount: 1 } });

      // Notify all followers (non-blocking)
      Follow.find({ following: session.userId }).select('follower').lean()
        .then(async (follows) => {
          if (follows.length > 0) {
            const notifications = follows.map(f => ({
              recipient: f.follower,
              actor: session.userId,
              type: 'new_post',
              post: post._id,
              message: 'published a new article',
            }));
            await Notification.insertMany(notifications).catch(err =>
              console.error('Follower notification error:', err.message)
            );
          }
        })
        .catch(err => console.error('Follower query error:', err.message));
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
