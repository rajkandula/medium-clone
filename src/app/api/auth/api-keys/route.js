import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ApiKey from '@/models/ApiKey';
import { getSession } from '@/lib/auth';
import { generateApiKey } from '@/lib/apiAuth';

/**
 * GET /api/auth/api-keys — List user's API keys
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const keys = await ApiKey.find({ user: session.userId })
      .select('prefix name lastUsedAt createdAt expiresAt')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('List API keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/auth/api-keys — Generate a new API key
 * Returns the full key ONCE — it cannot be retrieved again.
 */
export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { name } = await req.json();

    // Limit to 5 active keys per user
    const existingCount = await ApiKey.countDocuments({ user: session.userId });
    if (existingCount >= 5) {
      return NextResponse.json({ error: 'Maximum 5 API keys allowed. Please revoke an existing key first.' }, { status: 400 });
    }

    const { rawKey, prefix, keyHash } = generateApiKey();

    await ApiKey.create({
      keyHash,
      prefix,
      name: name || 'Untitled Key',
      user: session.userId,
    });

    return NextResponse.json({
      key: rawKey, // Shown once, never stored in plain text
      prefix,
      name: name || 'Untitled Key',
      message: 'Save this key now — it won\'t be shown again.',
    }, { status: 201 });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/api-keys — Revoke an API key
 */
export async function DELETE(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get('id');

    if (!keyId) return NextResponse.json({ error: 'Key ID required' }, { status: 400 });

    const result = await ApiKey.findOneAndDelete({ _id: keyId, user: session.userId });
    if (!result) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
