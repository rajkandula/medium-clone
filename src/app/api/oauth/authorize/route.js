import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/siteUrl';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import OAuthClient from '@/models/OAuthClient';

// GET /api/oauth/authorize
// Claude redirects the user here to log in and approve access.
// If already logged in → show approval page.
// If not logged in → redirect to login first.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method') || 'S256';
  const responseType = searchParams.get('response_type');

  if (responseType !== 'code') {
    return NextResponse.json({ error: 'unsupported_response_type' }, { status: 400 });
  }

  if (!clientId) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'client_id required' }, { status: 400 });
  }

  if (!redirectUri) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'redirect_uri required' }, { status: 400 });
  }

  // PKCE is mandatory and must use S256 — prevents authorization-code interception.
  if (!codeChallenge) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'code_challenge required (PKCE)' }, { status: 400 });
  }
  if (codeChallengeMethod !== 'S256') {
    return NextResponse.json({ error: 'invalid_request', error_description: 'code_challenge_method must be S256' }, { status: 400 });
  }

  // Validate the client and that redirect_uri is registered BEFORE rendering
  // consent or issuing anything. Never redirect to an unvalidated redirect_uri
  // (open redirect → authorization-code/token leak).
  await dbConnect();
  const client = await OAuthClient.findOne({ clientId });
  if (!client) {
    return NextResponse.json({ error: 'invalid_client', error_description: 'Unknown client_id' }, { status: 400 });
  }
  if (!Array.isArray(client.redirectUris) || !client.redirectUris.includes(redirectUri)) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'redirect_uri is not registered for this client' }, { status: 400 });
  }

  // Check if user is logged in
  const session = await getSession();

  if (!session) {
    // Redirect to login, then back here after login
    const baseUrl = SITE_URL;
    const currentUrl = request.url;
    return NextResponse.redirect(`${baseUrl}/login?redirect=${encodeURIComponent(currentUrl)}`);
  }

  // User is logged in — render approval page
  const baseUrl = SITE_URL;
  const approveUrl = new URL(`${baseUrl}/api/oauth/approve`);
  approveUrl.searchParams.set('client_id', clientId || '');
  approveUrl.searchParams.set('redirect_uri', redirectUri);
  approveUrl.searchParams.set('state', state || '');
  approveUrl.searchParams.set('code_challenge', codeChallenge || '');
  approveUrl.searchParams.set('code_challenge_method', codeChallengeMethod);

  // Return a simple HTML approval page
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authorize — BlogWrite</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #0a0b0f; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .card {
      background: #12131a; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
      padding: 48px; max-width: 440px; width: 100%; text-align: center;
      box-shadow: 0 24px 80px rgba(0,0,0,0.4);
    }
    .logo {
      width: 56px; height: 56px; border-radius: 14px; margin: 0 auto 20px;
      display: block;
      object-fit: contain;
    }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    .desc { color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
    .perms {
      text-align: left; background: rgba(255,255,255,0.04); border-radius: 12px;
      padding: 16px 20px; margin-bottom: 28px;
    }
    .perms h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 12px; }
    .perms li { list-style: none; font-size: 13px; color: #d1d5db; padding: 5px 0; display: flex; align-items: center; gap: 8px; }
    .perms li::before { content: '✓'; color: #10b981; font-weight: 700; }
    .actions { display: flex; gap: 12px; }
    .btn {
      flex: 1; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 600;
      cursor: pointer; border: none; transition: all 0.2s;
    }
    .btn-cancel {
      background: rgba(255,255,255,0.06); color: #9ca3af; border: 1px solid rgba(255,255,255,0.1);
    }
    .btn-cancel:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .btn-approve {
      background: linear-gradient(135deg, #10b981, #059669); color: #fff;
      box-shadow: 0 4px 20px rgba(16,185,129,0.3);
    }
    .btn-approve:hover { box-shadow: 0 6px 28px rgba(16,185,129,0.45); transform: translateY(-1px); }
    .user { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
    .user strong { color: #d1d5db; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${baseUrl}/apple-touch-icon.png" alt="BlogWrite" class="logo" />
    <h1>Connect to BlogWrite</h1>
    <p class="desc">Claude wants to access your BlogWrite workspace to manage drafts, publish posts, and view feed insights on your behalf.</p>
    <p class="user">Signed in as <strong>${session.email || session.name || 'User'}</strong></p>
    <div class="perms">
      <h3>Permissions requested</h3>
      <ul>
        <li>List and read blog posts and drafts</li>
        <li>Create and publish new blog posts</li>
        <li>Read Pulse news feed articles</li>
        <li>Read curated academic research papers</li>
      </ul>
    </div>
    <div class="actions">
      <button class="btn btn-cancel" onclick="window.close()">Cancel</button>
      <form method="POST" action="${approveUrl.toString()}" style="flex:1">
        <button type="submit" class="btn btn-approve" style="width:100%">Authorize</button>
      </form>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
