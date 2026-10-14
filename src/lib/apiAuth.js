import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ApiKey from '@/models/ApiKey';
import User from '@/models/User';
import crypto from 'crypto';

/**
 * Unified authentication: checks Bearer API key first, falls back to cookie session.
 * Returns session object { userId, email, role } or null.
 */
export async function getApiSession() {
  // 1. Check for Bearer token (API key auth)
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (authHeader?.startsWith('Bearer bw_')) {
    const apiKey = authHeader.slice(7); // Remove "Bearer "
    return await validateApiKey(apiKey);
  }

  // 1b. Also accept the API key via the x-api-key header (header-based — never
  // ends up in URLs, proxy logs, or browser history the way a query param does).
  const apiKeyHeader = headersList.get('x-api-key');
  if (apiKeyHeader?.startsWith('bw_')) {
    return await validateApiKey(apiKeyHeader);
  }

  // 2. Fall back to cookie-based session
  return await getSession();
}

/**
 * Validate an API key and return the associated user session.
 * Uses SHA-256 hash comparison (not bcrypt) for fast lookup.
 */
export async function validateApiKey(rawKey) {
  try {
    await dbConnect();

    // Hash the raw key to compare against stored hash
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    
    const apiKey = await ApiKey.findOne({ keyHash });
    if (!apiKey) return null;

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // Update last used timestamp (non-blocking)
    ApiKey.updateOne({ _id: apiKey._id }, { lastUsedAt: new Date() }).catch(() => {});

    // Fetch user
    const user = await User.findById(apiKey.user).select('email role').lean();
    if (!user) return null;

    return {
      userId: apiKey.user.toString(),
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return null;
  }
}

/**
 * Generate a new API key.
 * Returns { rawKey, prefix, keyHash } — rawKey is shown once to the user.
 */
export function generateApiKey() {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const rawKey = `bw_${randomBytes}`;
  const prefix = rawKey.substring(0, 10); // "bw_" + first 7 chars
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  return { rawKey, prefix, keyHash };
}
