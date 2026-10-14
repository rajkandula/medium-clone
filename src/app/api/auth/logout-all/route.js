import { NextResponse } from 'next/server';
import { getSession, clearAuthCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// POST /api/auth/logout-all
// "Log out everywhere" — bumps the user's tokenVersion so every previously
// issued session (on any device) is invalidated, then clears this device's cookie.
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  await User.findByIdAndUpdate(session.userId, { $inc: { tokenVersion: 1 } });
  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
