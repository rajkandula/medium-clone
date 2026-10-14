import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import Follow from '@/models/Follow';
import User from '@/models/User';
import Category from '@/models/Category';
import Like from '@/models/Like';
import Bookmark from '@/models/Bookmark';
import ReadingHistory from '@/models/ReadingHistory';
import { getSession } from '@/lib/auth';
import { rankFeedPosts, rankTrendingPosts } from '@/lib/feed';

/**
 * Deduplicate posts with very similar titles (Levenshtein-like)
 * Keeps the post with the highest engagement.
 */
function deduplicatePosts(posts) {
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const seen = [];
  return posts.filter(post => {
    const norm = normalize(post.title || '');
    // Check if a very similar title already exists
    const isDuplicate = seen.some(s => {
      if (norm === s) return true;
      // Simple similarity: if one contains 80%+ of the other's words
      const words1 = norm.split(' ');
      const words2 = s.split(' ');
      const overlap = words1.filter(w => words2.includes(w)).length;
      const similarity = overlap / Math.max(words1.length, words2.length);
      return similarity > 0.8;
    });
    if (!isDuplicate) {
      seen.push(norm);
      return true;
    }
    return false;
  });
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'personalized';
    const format = searchParams.get('format'); // 'blog' | 'product' | 'research' | 'pulse' | null (all)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const skip = (page - 1) * limit;

    // Build format filter
    const formatFilter = {};
    if (format === 'blog') formatFilter.format = { $in: ['richtext', 'markdown', 'latex', 'html', null] };
    else if (format === 'product') formatFilter.format = 'product';
    else if (format === 'aiconcept') { formatFilter.format = 'product'; formatFilter.isAiGenerated = true; }

    // Resolve the session ONCE and reuse it for personalization + enrichment.
    let session = null;
    try { session = await getSession(); } catch {}

    let ranked;

    if (type === 'trending') {
      const trendingPosts = await Post.find({ status: 'published', publishedAt: { $gte: new Date(Date.now() - 7 * 24 * 3600000) }, ...formatFilter })
        .select('-content')
        .populate('author', 'name username avatar').populate('category', 'name slug color')
        .sort({ publishedAt: -1 })
        .limit(400)
        .lean();
      ranked = deduplicatePosts(rankTrendingPosts(trendingPosts));
    } else {
      // Personalized feed — combine signup interests, follows, and behavioral affinity.
      let userInterests = [], followingIds = [];
      const affinityMap = new Map();

      if (session) {
        const [user, follows] = await Promise.all([
          User.findById(session.userId).select('interests').lean(),
          Follow.find({ follower: session.userId }).select('following').lean(),
        ]);
        userInterests = user?.interests || [];
        followingIds = follows.map(f => f.following);

        // Behavioral affinity: which tags/categories has this user actually engaged with?
        const [likedIds, bookmarkedIds, readRows] = await Promise.all([
          Like.find({ user: session.userId }).sort({ createdAt: -1 }).limit(60).distinct('post'),
          Bookmark.find({ user: session.userId, itemType: 'post' }).sort({ createdAt: -1 }).limit(60).distinct('post'),
          ReadingHistory.find({ user: session.userId }).sort({ updatedAt: -1 }).limit(60).select('post').lean(),
        ]);
        const engagedIds = [...new Set(
          [...likedIds, ...bookmarkedIds, ...readRows.map(r => r.post)].filter(Boolean).map(String)
        )];
        if (engagedIds.length) {
          const engaged = await Post.find({ _id: { $in: engagedIds } })
            .select('tags category').populate('category', 'slug').lean();
          for (const p of engaged) {
            const tags = [...(p.tags || []), p.category?.slug].filter(Boolean);
            for (const t of tags) {
              const k = String(t).toLowerCase();
              affinityMap.set(k, (affinityMap.get(k) || 0) + 1);
            }
          }
        }
      }

      const allPosts = await Post.find({ status: 'published', ...formatFilter })
        .select('-content')
        .populate('author', 'name username avatar').populate('category', 'name slug color')
        .sort({ publishedAt: -1 }).limit(300).lean();

      ranked = deduplicatePosts(rankFeedPosts(allPosts, userInterests, followingIds, affinityMap));
    }

    // Total reflects the ranked+deduped window, so hasMore stays consistent across pages.
    const total = ranked.length;
    let posts = ranked.slice(skip, skip + limit);

    // Enrich posts with the current user's like/bookmark state (reuse the single session).
    if (session && posts.length) {
      try {
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
      } catch (e) {
        console.error('Error enriching feed posts:', e);
      }
    }

    return NextResponse.json({ posts, total, page, hasMore: skip + posts.length < total });
  } catch (error) {
    console.error('Feed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
