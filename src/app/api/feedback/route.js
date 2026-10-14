import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Feedback from '@/models/Feedback';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user || user.role !== 'admin') return null;
  return user;
}

// POST /api/feedback - Public endpoint to submit feedback
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { category, rating, text, name, email, sentiment } = body;

    // Basic Validation
    if (!category || !rating || !text?.trim()) {
      return NextResponse.json({ error: 'Category, rating, and comments are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    if (text.trim().length > 1000) {
      return NextResponse.json({ error: 'Comments must not exceed 1000 characters' }, { status: 400 });
    }

    // Resolve user session if authenticated
    const session = await getSession();
    let submittedBy = null;
    let finalName = name?.trim();
    let finalEmail = email?.trim();

    if (session?.userId) {
      const user = await User.findById(session.userId).select('name email');
      if (user) {
        submittedBy = user._id;
        if (!finalName) finalName = user.name;
        if (!finalEmail) finalEmail = user.email;
      }
    }

    // Fallback sentiment analysis based on rating if not explicitly specified
    let finalSentiment = sentiment;
    if (!finalSentiment) {
      if (rating >= 4) finalSentiment = 'happy';
      else if (rating <= 2) finalSentiment = 'sad';
      else finalSentiment = 'neutral';
    }

    const feedback = await Feedback.create({
      submittedBy,
      name: finalName || 'Anonymous User',
      email: finalEmail || 'anonymous@example.com',
      category,
      rating,
      text: text.trim(),
      sentiment: finalSentiment,
    });

    return NextResponse.json({ success: true, feedbackId: feedback._id });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/feedback - Admin only, fetch feedback list
export async function GET(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const sentiment = searchParams.get('sentiment');

    const query = {};
    if (category) query.category = category;
    if (sentiment) query.sentiment = sentiment;

    const [feedbacks, total] = await Promise.all([
      Feedback.find(query)
        .populate('submittedBy', 'name username avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(query)
    ]);

    return NextResponse.json({
      feedbacks,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Fetch feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
