import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import OAuthCode from '@/models/OAuthCode';
import ApiKey from '@/models/ApiKey';
import { generateApiKey } from '@/lib/apiAuth';

// POST /api/oauth/token
// Claude calls this to exchange an authorization code for an access token.
// The access token IS a standard API key — our MCP server already validates Bearer tokens.
export async function POST(request) {
  let body;
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await request.text();
    body = Object.fromEntries(new URLSearchParams(text));
  } else {
    body = await request.json().catch(() => ({}));
  }

  const { grant_type, code, redirect_uri, code_verifier, client_id, client_secret } = body;

  if (grant_type !== 'authorization_code') {
    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'code required' }, { status: 400 });
  }

  await dbConnect();

  // Find the authorization code
  const authCode = await OAuthCode.findOne({ code, used: false });

  if (!authCode) {
    return NextResponse.json({ error: 'invalid_grant', error_description: 'Invalid or expired code' }, { status: 400 });
  }

  // Check expiry
  if (authCode.expiresAt < new Date()) {
    return NextResponse.json({ error: 'invalid_grant', error_description: 'Code has expired' }, { status: 400 });
  }

  // Bind the code to the client that requested it — a code issued to one client
  // must not be redeemable by another.
  if (!client_id || authCode.clientId !== client_id) {
    return NextResponse.json({ error: 'invalid_grant', error_description: 'client_id mismatch' }, { status: 400 });
  }

  // redirect_uri is required and must match the one bound to the code.
  if (!redirect_uri || redirect_uri !== authCode.redirectUri) {
    return NextResponse.json({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' }, { status: 400 });
  }

  // PKCE is mandatory and S256-only. A code without a stored S256 challenge is
  // rejected outright (defense in depth — /authorize + /approve already enforce this).
  if (!authCode.codeChallenge || authCode.codeChallengeMethod !== 'S256') {
    return NextResponse.json({ error: 'invalid_grant', error_description: 'PKCE (S256) required' }, { status: 400 });
  }
  if (!code_verifier) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'code_verifier required' }, { status: 400 });
  }
  const challengeHash = crypto.createHash('sha256').update(code_verifier).digest('base64url');
  if (challengeHash !== authCode.codeChallenge) {
    return NextResponse.json({ error: 'invalid_grant', error_description: 'code_verifier mismatch' }, { status: 400 });
  }

  // Mark code as used
  authCode.used = true;
  await authCode.save();

  // Generate an API key as the access token
  const { rawKey: accessToken, prefix, keyHash } = generateApiKey();
  await ApiKey.create({
    keyHash,
    prefix,
    name: 'Claude Connector (auto)',
    user: authCode.userId,
  });

  // Return OAuth token response
  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    // No expiry — key is permanent until revoked
  });
}
