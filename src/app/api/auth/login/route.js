import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import { signToken, setAuthCookie } from '@/lib/auth';
import { getClientIp, enforceRateLimit } from '@/lib/rateLimit';

export async function POST(req) {
  try {
    await dbConnect();

    const ip = getClientIp(req);
    const limited = await enforceRateLimit(NextResponse, {
      key: `login:${ip}`,
      limit: 10,
      windowMs: 5 * 60 * 1000,
      message: 'Too many login attempts. Please try again in a few minutes.',
    });
    if (limited) return limited;

    const { email, usernameOrEmail, password } = await req.json();
    const identifier = usernameOrEmail || email;

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Username/Email and password are required' }, { status: 400 });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        // Escaped so the typed username is matched literally, never run as a pattern.
        { username: { $regex: new RegExp(`^${String(identifier).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = await signToken({ userId: user._id.toString(), email: user.email, role: user.role, tv: user.tokenVersion || 0 });
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, username: user.username, avatar: user.avatar, role: user.role, subscription: user.subscription },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
