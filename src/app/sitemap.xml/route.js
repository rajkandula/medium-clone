import dbConnect from '@/lib/db';
import { SITE_URL } from '@/lib/siteUrl';
import Post from '@/models/Post';

export const dynamic = 'force-dynamic';

export async function GET() {
  await dbConnect();
  const posts = await Post.find({ status: 'published' }).select('slug updatedAt').lean();
  const baseUrl = SITE_URL;

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/explore</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/pulse</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/about</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${baseUrl}/contact</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${baseUrl}/privacy</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${baseUrl}/terms</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  ${posts.map(p => `<url><loc>${baseUrl}/blog/${p.slug}</loc><lastmod>${new Date(p.updatedAt).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('\n  ')}
</urlset>`;

  return new Response(sitemap, { headers: { 'Content-Type': 'application/xml' } });
}
