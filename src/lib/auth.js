import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Resolve the signing key lazily so a misconfiguration fails loudly on use
// (mirroring db.js) rather than silently signing/verifying with a weak,
// repo-committed fallback. There is intentionally NO hardcoded fallback.
function getSigningKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET environment variable is missing or too short (must be at least 32 characters). Refusing to sign or verify tokens with an insecure secret.'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSigningKey());
}

export async function verifyToken(token) {
  // Resolve the key outside the try so a missing/invalid secret throws loudly
  // (500) instead of being swallowed into a null that silently logs everyone out.
  const key = getSigningKey();
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  // Token revocation: a session is valid only while its `tv` claim matches the
  // user's current tokenVersion. Bumping tokenVersion (password reset, "log out
  // everywhere") invalidates every previously-issued token. Tokens minted before
  // this claim existed have no `tv` and are left alone for backward compatibility.
  // db/User are imported dynamically so mongoose never enters the proxy
  // bundle (src/proxy.js only calls verifyToken, never getSession).
  if (typeof payload.tv === 'number') {
    try {
      const { default: dbConnect } = await import('@/lib/db');
      const { default: User } = await import('@/models/User');
      await dbConnect();
      const user = await User.findById(payload.userId).select('tokenVersion').lean();
      if (!user) return null;
      if ((user.tokenVersion || 0) !== payload.tv) return null;
    } catch (err) {
      // Fail open on transient DB errors rather than logging everyone out.
      console.error('Session revocation check failed (allowing token):', err?.message);
    }
  }

  return payload;
}
