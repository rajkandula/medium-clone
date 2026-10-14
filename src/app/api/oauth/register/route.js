import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OAuthClient from '@/models/OAuthClient';

// POST /api/oauth/register
// RFC 7591 — Dynamic Client Registration
// Claude calls this to register itself as an OAuth client and receive a client_id.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_client_metadata', error_description: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { redirect_uris, client_name, grant_types, token_endpoint_auth_method } = body;

  if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    return NextResponse.json(
      { error: 'invalid_client_metadata', error_description: 'redirect_uris is required and must be a non-empty array' },
      { status: 400 }
    );
  }

  // Only register parseable http(s) redirect URIs — these are later exact-matched
  // at /authorize and /approve, so reject junk/non-web schemes up front.
  const isValidRedirectUri = (uri) => {
    if (typeof uri !== 'string') return false;
    try {
      const u = new URL(uri);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch {
      return false;
    }
  };
  if (!redirect_uris.every(isValidRedirectUri)) {
    return NextResponse.json(
      { error: 'invalid_redirect_uri', error_description: 'Every redirect_uri must be a valid http(s) URL' },
      { status: 400 }
    );
  }

  await dbConnect();

  const clientId = OAuthClient.generateClientId();

  await OAuthClient.create({
    clientId,
    clientName: client_name || 'MCP Client',
    redirectUris: redirect_uris,
    grantTypes: grant_types || ['authorization_code'],
    tokenEndpointAuthMethod: token_endpoint_auth_method || 'none',
  });

  // Return the registered client metadata per RFC 7591
  return NextResponse.json({
    client_id: clientId,
    client_name: client_name || 'MCP Client',
    redirect_uris,
    grant_types: grant_types || ['authorization_code'],
    token_endpoint_auth_method: token_endpoint_auth_method || 'none',
  }, { status: 201 });
}
