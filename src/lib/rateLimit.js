import dbConnect from '@/lib/db';
import RateLimit from '@/models/RateLimit';

// Best-effort client IP from common proxy headers (most hosts set x-forwarded-for).
export function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * MongoDB-backed fixed-window rate limiter.
 * Atomically increments a per-(key, window) counter and reports whether the
 * caller is still under `limit` for the current window.
 *
 * @returns {Promise<{ allowed: boolean, remaining: number, retryAfter: number }>}
 */
export async function rateLimit({ key, limit, windowMs }) {
  await dbConnect();
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const bucketKey = `${key}:${windowStart}`;
  const expiresAt = new Date(windowStart + windowMs);

  const doc = await RateLimit.findOneAndUpdate(
    { key: bucketKey },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, new: true }
  );

  return {
    allowed: doc.count <= limit,
    remaining: Math.max(0, limit - doc.count),
    retryAfter: Math.ceil((windowStart + windowMs - now) / 1000),
  };
}

// Convenience wrapper: enforce a limit and return a 429 Response if exceeded,
// or null if the request may proceed.
export async function enforceRateLimit(NextResponse, { key, limit, windowMs, message }) {
  const result = await rateLimit({ key, limit, windowMs });
  if (!result.allowed) {
    return NextResponse.json(
      { error: message || 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
    );
  }
  return null;
}
