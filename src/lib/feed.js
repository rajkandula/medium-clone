/**
 * Feed algorithm engine for personalized content discovery.
 * Weighted scoring (sums to ~1.0):
 * - Behavioral affinity (likes/bookmarks/reads): 0.30
 * - Interest match (signup interests, fuzzy):   0.20
 * - Recency:                                     0.20
 * - Engagement (Wilson score):                   0.20
 * - Author follow bonus:                         0.10
 */

/**
 * Calculate personalized feed score for a post.
 * @param affinityMap Map<lowercased tag/category slug, count> of what the user actually engages with.
 */
export function calculateFeedScore(post, userInterests = [], followingIds = [], affinityMap = null) {
  let score = 0;

  const postTags = [...(post.tags || []), post.category?.slug]
    .filter(Boolean)
    .map(t => String(t).toLowerCase());

  // 1. Behavioral affinity (0.30) — the strongest personalization signal: tags/categories
  //    the user has actually liked, bookmarked, or read.
  if (affinityMap && affinityMap.size && postTags.length) {
    const maxCount = Math.max(...affinityMap.values());
    const matched = postTags.reduce((sum, t) => sum + (affinityMap.get(t) || 0), 0);
    score += Math.min(1, matched / (maxCount || 1)) * 0.30;
  }

  // 2. Interest match (0.20) — fuzzy substring match so "ai" hits "generative-ai", "web" hits "web-dev".
  if (postTags.length && userInterests.length) {
    const ints = userInterests.map(i => String(i).toLowerCase()).filter(Boolean);
    const overlap = postTags.filter(t => ints.some(i => i === t || t.includes(i) || i.includes(t))).length;
    score += (overlap / postTags.length) * 0.20;
  }

  // 3. Recency decay (0.20) over 30 days
  const ageHours = (Date.now() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60);
  score += Math.max(0, 1 - (ageHours / (24 * 30))) * 0.20;

  // 4. Engagement (0.20) — Wilson score interval
  score += calculateWilsonScore(
    (post.likesCount || 0) + (post.commentsCount || 0) + (post.bookmarksCount || 0),
    post.viewCount || 0
  ) * 0.20;

  // 5. Author follow bonus (0.10)
  const authorId = post.author?._id?.toString() || post.author?.toString();
  if (authorId && followingIds.some(id => id.toString() === authorId)) score += 0.10;

  return score;
}

/**
 * Wilson score interval for trending calculation
 * More statistically robust than simple ratio
 */
export function calculateWilsonScore(positive, total) {
  if (total === 0) return 0;
  
  const z = 1.96; // 95% confidence
  const p = positive / total;
  const n = total;
  
  const numerator = p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  const denominator = 1 + (z * z) / n;
  
  return Math.max(0, numerator / denominator);
}

/**
 * Get trending score with time decay
 */
export function calculateTrendingScore(post) {
  const ageHours = (Date.now() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60);
  const engagement = post.likesCount * 3 + post.commentsCount * 5 + post.bookmarksCount * 2;
  
  // Hacker News-style gravity
  const gravity = 1.8;
  return engagement / Math.pow(ageHours + 2, gravity);
}

/**
 * Sort posts by personalized feed score
 */
export function rankFeedPosts(posts, userInterests = [], followingIds = [], affinityMap = null) {
  return posts
    .map(post => ({
      ...post,
      _feedScore: calculateFeedScore(post, userInterests, followingIds, affinityMap),
    }))
    .sort((a, b) => b._feedScore - a._feedScore);
}

/**
 * Sort posts by trending score
 */
export function rankTrendingPosts(posts) {
  return posts
    .map(post => ({
      ...post,
      _trendingScore: calculateTrendingScore(post),
    }))
    .sort((a, b) => b._trendingScore - a._trendingScore);
}
