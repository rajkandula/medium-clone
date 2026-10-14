import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/siteUrl';

// RFC 9728 — Protected Resource Metadata
// Claude discovers this first to find which authorization server to use
export async function GET() {
  const baseUrl = SITE_URL;

  return NextResponse.json({
    resource: baseUrl,
    authorization_servers: [baseUrl],
  });
}
