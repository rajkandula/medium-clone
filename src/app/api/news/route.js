import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NewsArticle from '@/models/NewsArticle';

/**
 * GET /api/news
 * Returns approved news articles, filterable by topic and sortable.
 * Public endpoint — no auth required.
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const topic = searchParams.get('topic');  // Optional topic filter
    const sortBy = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query = { isApproved: true };
    if (topic && topic !== 'all') {
      query.topics = topic;
    }

    // Determine sort order
    let sort;
    switch (sortBy) {
      case 'trending': {
        // Trending: decay-weighted engagement score via aggregation
        const pipeline = [
          { $match: query },
          {
            $addFields: {
              _ageHours: {
                $divide: [
                  { $subtract: [new Date(), '$publishedAt'] },
                  3600000,
                ],
              },
            },
          },
          {
            $addFields: {
              _trendingScore: {
                $divide: [
                  { $add: [
                    { $multiply: ['$savedCount', 3] },
                    { $multiply: ['$viewCount', 1] },
                    { $multiply: ['$shareCount', 2] },
                  ]},
                  { $pow: [{ $add: ['$_ageHours', 2] }, 1.8] },
                ],
              },
            },
          },
          { $sort: { _trendingScore: -1 } },
          { $skip: skip },
          { $limit: limit },
          { $project: { _ageHours: 0, _trendingScore: 0 } },
        ];

        const [articles, total, allTopics] = await Promise.all([
          NewsArticle.aggregate(pipeline),
          NewsArticle.countDocuments(query),
          NewsArticle.distinct('topics', { isApproved: true }),
        ]);

        return NextResponse.json({
          articles,
          total,
          page,
          totalPages: Math.ceil(total / limit),
          topics: allTopics.sort(),
        });
      }
      case 'most-saved':
        sort = { savedCount: -1, publishedAt: -1 };
        break;
      case 'newest':
      default:
        sort = { publishedAt: -1 };
        break;
    }

    const [articles, total] = await Promise.all([
      NewsArticle.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      NewsArticle.countDocuments(query),
    ]);

    // Get unique topics for filter UI
    const allTopics = await NewsArticle.distinct('topics', { isApproved: true });

    return NextResponse.json({
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      topics: allTopics.sort(),
    });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
