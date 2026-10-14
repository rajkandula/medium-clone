import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import OAuthCode from '@/models/OAuthCode';
import OAuthClient from '@/models/OAuthClient';

// POST /api/oauth/approve
// Called when user clicks "Authorize" on the approval page.
// Issues an authorization code and redirects back to Claude.
export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id') || '';
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state') || '';
  const codeChallenge = searchParams.get('code_challenge') || '';
  const codeChallengeMethod = searchParams.get('code_challenge_method') || 'S256';

  if (!clientId) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'client_id required' }, { status: 400 });
  }

  if (!redirectUri) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'redirect_uri required' }, { status: 400 });
  }

  // PKCE is mandatory (S256 only). A direct POST here must not be able to mint a
  // code without a valid challenge.
  if (!codeChallenge || codeChallengeMethod !== 'S256') {
    return NextResponse.json({ error: 'invalid_request', error_description: 'code_challenge (S256) required' }, { status: 400 });
  }

  await dbConnect();

  // Re-validate the client and redirect_uri here too — /approve can be POSTed
  // directly, bypassing the checks in /authorize.
  const client = await OAuthClient.findOne({ clientId });
  if (!client) {
    return NextResponse.json({ error: 'invalid_client', error_description: 'Unknown client_id' }, { status: 400 });
  }
  if (!Array.isArray(client.redirectUris) || !client.redirectUris.includes(redirectUri)) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'redirect_uri is not registered for this client' }, { status: 400 });
  }

  // Generate authorization code
  const code = OAuthCode.generateCode();
  await OAuthCode.create({
    code,
    userId: session.userId,
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minute expiry
  });

  // Redirect back to Claude with the code
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set('code', code);
  if (state) callbackUrl.searchParams.set('state', state);

  return NextResponse.redirect(callbackUrl.toString(), 303);
}
