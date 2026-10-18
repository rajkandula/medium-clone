import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import User from '@/models/User';
import Like from '@/models/Like';
import Bookmark from '@/models/Bookmark';
import Category from '@/models/Category';
import Series from '@/models/Series';
import { getSession } from '@/lib/auth';
import { estimateReadTime, createSlug } from '@/lib/utils';

// GET /api/posts/[id]
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    // Support both ObjectId and slug lookup
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const post = await Post.findOne(query)
      .populate('author', 'name username avatar bio followersCount')
      .populate('category', 'name slug color')
      .lean();

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Unpublished posts are visible to their author and admins only; to
    // everyone else they do not exist.
    if (post.status !== 'published') {
      const viewer = await getSession();
      const authorId = (post.author?._id || post.author)?.toString();
      if (!viewer || (viewer.role !== 'admin' && viewer.userId !== authorId)) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
    }

    // Increment view count
    await Post.findByIdAndUpdate(post._id, { $inc: { viewCount: 1 } });

    // Check if current user liked/bookmarked
    let userLiked = false, userBookmarked = false;
    try {
      const session = await getSession();
      if (session) {
        const [like, bookmark] = await Promise.all([
          Like.findOne({ user: session.userId, post: post._id }),
          Bookmark.findOne({ user: session.userId, post: post._id }),
        ]);
        userLiked = !!like;
        userBookmarked = !!bookmark;
      }
    } catch {}

    // Related / "next to read": same category or shared tags, most recent first.
    const orClauses = [];
    if (post.category?._id) orClauses.push({ category: post.category._id });
    if (Array.isArray(post.tags) && post.tags.length) orClauses.push({ tags: { $in: post.tags } });
    let relatedPosts = [];
    if (orClauses.length) {
      relatedPosts = await Post.find({
        _id: { $ne: post._id },
        status: 'published',
        $or: orClauses,
      })
        .select('title slug excerpt coverImage category tags readTime publishedAt format appName appIcon isAiGenerated')
        .populate('category', 'name slug color')
        .sort({ publishedAt: -1 })
        .limit(6)
        .lean();
    }

    // Series context: which published learning path contains this post + prev/next.
    let seriesContext = null;
    const memberSeries = await Series.findOne({ posts: post._id, status: 'published' })
      .sort({ publishedAt: 1 })
      .select('title slug posts')
      .populate({ path: 'posts', match: { status: 'published' }, select: 'title slug' })
      .lean();
    if (memberSeries) {
      const ordered = (memberSeries.posts || []).filter(Boolean);
      const idx = ordered.findIndex(p => p._id.toString() === post._id.toString());
      if (idx !== -1) {
        seriesContext = {
          title: memberSeries.title,
          slug: memberSeries.slug,
          part: idx + 1,
          total: ordered.length,
          prev: idx > 0 ? { title: ordered[idx - 1].title, slug: ordered[idx - 1].slug } : null,
          next: idx < ordered.length - 1 ? { title: ordered[idx + 1].title, slug: ordered[idx + 1].slug } : null,
        };
      }
    }

    return NextResponse.json({ post: { ...post, viewCount: (post.viewCount || 0) + 1 }, userLiked, userBookmarked, relatedPosts, seriesContext });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/posts/[id]
export async function PUT(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (post.author.toString() !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const wasPublished = post.status === 'published';
    const { title, content, excerpt, coverImage, category, tags, status: newStatus, seoTitle, seoDescription, format, collections, productUrl, appName, pricing, launchDate, appDescription, appImages, appIcon, systemArchitecture, techStack, dbSchema, apiSpecs, devPlan } = body;

    if (title) {
      post.title = title;
      // Regenerate slug from title (fixes slugs generated from LaTeX content)
      const newSlug = createSlug(title);
      if (newSlug && newSlug !== post.slug) {
        const existing = await Post.findOne({ slug: newSlug, _id: { $ne: post._id } });
        post.slug = existing ? `${newSlug}-${Date.now().toString(36)}` : newSlug;
      }
    }
    if (content) { post.content = content; post.readTime = estimateReadTime(content); }
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (coverImage !== undefined) post.coverImage = coverImage;
    if (category !== undefined) post.category = category;
    if (tags) post.tags = tags;
    if (newStatus) post.status = newStatus;
    if (seoTitle !== undefined) post.seoTitle = seoTitle;
    if (seoDescription !== undefined) post.seoDescription = seoDescription;
    if (format) post.format = format;
    if (collections !== undefined) post.collections = collections;
    if (productUrl !== undefined) post.productUrl = productUrl;
    if (appName !== undefined) post.appName = appName;
    if (pricing !== undefined) post.pricing = pricing;
    if (launchDate !== undefined) post.launchDate = launchDate || null;
    if (appDescription !== undefined) post.appDescription = appDescription;
    if (appImages !== undefined) post.appImages = appImages;
    if (appIcon !== undefined) post.appIcon = appIcon;
    if (systemArchitecture !== undefined) post.systemArchitecture = systemArchitecture;
    if (techStack !== undefined) post.techStack = techStack;
    if (dbSchema !== undefined) post.dbSchema = dbSchema;
    if (apiSpecs !== undefined) post.apiSpecs = apiSpecs;
    if (devPlan !== undefined) post.devPlan = devPlan;

    if (!wasPublished && newStatus === 'published') {
      post.publishedAt = new Date();
      await User.findByIdAndUpdate(session.userId, { $inc: { postsCount: 1 } });
    } else if (wasPublished && newStatus === 'draft') {
      await User.findByIdAndUpdate(session.userId, { $inc: { postsCount: -1 } });
    }

    await post.save();
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/posts/[id]
export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (post.author.toString() !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (post.status === 'published') {
      await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } });
    }

    await Post.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
