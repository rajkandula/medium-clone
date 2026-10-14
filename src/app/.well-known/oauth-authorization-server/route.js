import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/siteUrl';

// OAuth 2.0 Authorization Server Metadata (RFC 8414)
// Claude discovers this to find our auth + token endpoints
export async function GET() {
  const baseUrl = SITE_URL;

  return NextResponse.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/oauth/token`,
    registration_endpoint: `${baseUrl}/api/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256', 'plain'],
    token_endpoint_auth_methods_supported: ['none'],
  });
}
