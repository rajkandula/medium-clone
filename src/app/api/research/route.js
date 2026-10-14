import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ResearchPaper from '@/models/ResearchPaper';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const topic = searchParams.get('topic');
    const sortBy = searchParams.get('sort') || 'recommended';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query = { isApproved: true };
    if (topic && topic !== 'all') {
      query.topics = topic;
    }

    // Get database-wide topics, counts and total count
    const [allTopics, topicCountsRaw, globalTotal] = await Promise.all([
      ResearchPaper.distinct('topics', { isApproved: true }),
      ResearchPaper.aggregate([
        { $match: { isApproved: true } },
        { $unwind: '$topics' },
        { $group: { _id: '$topics', count: { $sum: 1 } } }
      ]),
      ResearchPaper.countDocuments({ isApproved: true })
    ]);

    const topicCounts = {};
    topicCountsRaw.forEach(t => {
      if (t._id) {
        topicCounts[t._id] = t.count;
      }
    });

    // Handle 'recommended' sort option for 'all' topics (interleaved diverse feed)
    if ((!topic || topic === 'all') && sortBy === 'recommended') {
      let preferredTopics = [];
      const session = await getSession();
      if (session) {
        try {
          const Bookmark = (await import('@/models/Bookmark')).default;
          const userBookmarks = await Bookmark.find({ user: session.userId, itemType: 'research' })
            .populate('research')
            .lean();
          const topicsSet = new Set();
          userBookmarks.forEach(b => {
            if (b.research?.topics) {
              b.research.topics.forEach(t => topicsSet.add(t));
            }
          });
          preferredTopics = Array.from(topicsSet);
        } catch (sessionErr) {
          console.error('Failed to get user preferred topics:', sessionErr);
        }
      }

      // Filter out General Science fallback if other topics exist
      const activeTopics = allTopics.filter(t => t && t !== 'General Science');
      if (activeTopics.length === 0 && allTopics.includes('General Science')) {
        activeTopics.push('General Science');
      }

      // Fetch 30 newest papers per active topic in parallel
      const papersByTopic = await Promise.all(
        activeTopics.map(async (t) => {
          return ResearchPaper.find({ isApproved: true, topics: t })
            .sort({ publishedAt: -1 })
            .limit(30)
            .lean();
        })
      );

      const topicMap = {};
      activeTopics.forEach((t, i) => {
        topicMap[t] = papersByTopic[i] || [];
      });

      // Split topics into preferred and other categories
      const preferred = activeTopics.filter(t => preferredTopics.includes(t));
      const others = activeTopics.filter(t => !preferredTopics.includes(t));

      // Helper function to shuffle array
      const shuffleArray = (arr) => {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
      };

      const blended = [];
      const seenIds = new Set();

      // Interleave topics in round-robin fashion up to 30 rounds
      for (let round = 0; round < 30; round++) {
        // Shuffle the topics within groups for this round to ensure variety and freshness on reload
        const shuffledPreferred = shuffleArray(preferred);
        const shuffledOthers = shuffleArray(others);
        const orderedTopics = [...shuffledPreferred, ...shuffledOthers];

        let addedInRound = false;
        orderedTopics.forEach(t => {
          const list = topicMap[t];
          if (list && list.length > round) {
            const paper = list[round];
            if (paper && !seenIds.has(paper._id.toString())) {
              seenIds.add(paper._id.toString());
              blended.push(paper);
              addedInRound = true;
            }
          }
        });
        if (!addedInRound) break;
      }

      const total = blended.length;
      const papers = blended.slice(skip, skip + limit);

      return NextResponse.json({
        papers,
        total,
        globalTotal,
        page,
        totalPages: Math.ceil(total / limit),
        topics: allTopics.sort(),
        topicCounts,
      });
    }

    // Determine sort order
    let sort;
    switch (sortBy) {
      case 'trending': {
        // Trending: decay-weighted engagement score
        // We use an aggregation pipeline for this
        const pipeline = [
          { $match: query },
          {
            $addFields: {
              _ageHours: {
                $divide: [
                  { $subtract: [new Date(), '$publishedAt'] },
                  3600000, // ms to hours
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

        const [papers, total] = await Promise.all([
          ResearchPaper.aggregate(pipeline),
          ResearchPaper.countDocuments(query),
        ]);

        return NextResponse.json({
          papers,
          total,
          globalTotal,
          page,
          totalPages: Math.ceil(total / limit),
          topics: allTopics.sort(),
          topicCounts,
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

    const [papers, total] = await Promise.all([
      ResearchPaper.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      ResearchPaper.countDocuments(query),
    ]);

    return NextResponse.json({
      papers,
      total,
      globalTotal,
      page,
      totalPages: Math.ceil(total / limit),
      topics: allTopics.sort(),
      topicCounts,
    });
  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
