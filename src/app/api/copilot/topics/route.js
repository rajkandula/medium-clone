import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SuggestedTopic from '@/models/SuggestedTopic';
import { getSession } from '@/lib/auth';

const FALLBACK_TOPICS = [
  {
    topic: '10 Hidden CSS Features Every Frontend Developer Must Know in 2026',
    category: 'Web Development',
    tags: ['css', 'frontend', 'web-dev']
  },
  {
    topic: 'How AI Agents are Transforming Autonomous Coding and Software Engineering',
    category: 'AI & Machine Learning',
    tags: ['ai', 'machine-learning', 'software-eng']
  },
  {
    topic: 'Bootstrapping vs Fundraising: Choosing the Right Path for Your Startup',
    category: 'Startups & Business',
    tags: ['startups', 'business', 'saas']
  },
  {
    topic: 'The Art of Technical Writing: Documenting Code that People Actually Read',
    category: 'Career & Productivity',
    tags: ['career', 'productivity', 'writing']
  },
  {
    topic: 'Designing Systems for Accessibility Without Sacrificing Visual Aesthetics',
    category: 'Design & UX',
    tags: ['design', 'ux', 'a11y']
  },
  {
    topic: 'Understanding Climate Change: The Science Behind Global Warming',
    category: 'Science & Nature',
    tags: ['science', 'climate-change', 'education']
  }
];

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    await dbConnect();

    // Fetch 6 random topics from DB using aggregate sample stage
    let topics = await SuggestedTopic.aggregate([{ $sample: { size: 6 } }]);

    if (!topics || topics.length === 0) {
      topics = FALLBACK_TOPICS;
    }

    return NextResponse.json({ success: true, topics });
  } catch (error) {
    console.error('[CopilotTopics] Error fetching random topics:', error);
    return NextResponse.json({ success: false, topics: FALLBACK_TOPICS });
  }
}
