import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/siteUrl';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import PasswordReset from '@/models/PasswordReset';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/email';
import { getClientIp, enforceRateLimit } from '@/lib/rateLimit';

export async function POST(req) {
  try {
    await dbConnect();

    const ip = getClientIp(req);
    const limited = await enforceRateLimit(NextResponse, {
      key: `forgot-password:${ip}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: 'Too many password-reset requests. Please try again later.',
    });
    if (limited) return limited;

    const { email } = await req.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: true }); // Don't reveal if email exists
    }

    // High-entropy, single-use token (256 bits) — stronger than a UUID.
    const token = crypto.randomBytes(32).toString('hex');
    await PasswordReset.create({
      email, token,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    });

    const resetUrl = `${SITE_URL}/reset-password/${token}`;
    await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
