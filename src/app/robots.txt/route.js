import { SITE_URL } from '@/lib/siteUrl';

export async function GET() {
  const baseUrl = SITE_URL;
  const robots = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /api

Sitemap: ${baseUrl}/sitemap.xml`;

  return new Response(robots, { headers: { 'Content-Type': 'text/plain' } });
}
