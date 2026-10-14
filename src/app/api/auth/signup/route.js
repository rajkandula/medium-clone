import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import { signToken, setAuthCookie } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import { getClientIp, enforceRateLimit } from '@/lib/rateLimit';

export async function POST(req) {
  try {
    await dbConnect();

    const ip = getClientIp(req);
    const limited = await enforceRateLimit(NextResponse, {
      key: `signup:${ip}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
      message: 'Too many sign-up attempts. Please try again later.',
    });
    if (limited) return limited;

    const { name, email, username, password, interests } = await req.json();

    if (!name || !email || !username || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return NextResponse.json({ 
        error: existing.email === email ? 'Email already registered' : 'Username already taken' 
      }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const isAdmin = (process.env.ADMIN_EMAILS || '').split(',').includes(email);

    const user = await User.create({
      name, email, username: username.toLowerCase(),
      passwordHash, interests: interests || [],
      role: isAdmin ? 'admin' : 'user',
    });

    const token = await signToken({ userId: user._id.toString(), email: user.email, role: user.role, tv: user.tokenVersion || 0 });
    await setAuthCookie(token);

    sendWelcomeEmail(email, name).catch(() => {});

    return NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, username: user.username, avatar: user.avatar, role: user.role, subscription: user.subscription },
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
