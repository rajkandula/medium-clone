import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import dbConnect from '@/lib/db';
import PasswordReset from '@/models/PasswordReset';
import User from '@/models/User';
import { getClientIp, enforceRateLimit } from '@/lib/rateLimit';

// POST /api/auth/reset-password
// Consumes a password-reset token issued by /api/auth/forgot-password.
export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const limited = await enforceRateLimit(NextResponse, {
      key: `reset-password:${ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
      message: 'Too many attempts. Please try again later.',
    });
    if (limited) return limited;

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    await dbConnect();

    // Atomically claim the token: this only succeeds if it exists, is unused, and
    // is unexpired. The `used: false` filter makes the token strictly single-use
    // even under concurrent requests — only the first caller flips it and proceeds.
    const reset = await PasswordReset.findOneAndUpdate(
      { token, used: false, expiresAt: { $gt: new Date() } },
      { $set: { used: true } },
      { new: true }
    );

    if (!reset) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired' }, { status: 400 });
    }

    const user = await User.findOne({ email: reset.email });
    if (!user) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired' }, { status: 400 });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    // Invalidate every existing session for this account after a password reset.
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
