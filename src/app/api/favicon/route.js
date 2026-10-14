import { NextResponse } from 'next/server';

/**
 * GET /api/favicon?url=https://example.com
 * Returns the best icon URL found for the given site.
 * Priority: apple-touch-icon → high-res link[rel=icon] → og:image → /favicon.ico
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get('url');
  if (!rawUrl) return NextResponse.json({ error: 'url param required' }, { status: 400 });

  // Normalise — add https:// if missing
  let siteUrl;
  try {
    siteUrl = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const origin = siteUrl.origin; // e.g. https://example.com

  try {
    const html = await fetch(siteUrl.href, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlogWrite/1.0)' },
      signal: AbortSignal.timeout(6000),
    }).then(r => r.text());

    // Helper — resolve relative URLs against origin
    const resolve = (href) => {
      if (!href) return null;
      try { return new URL(href, origin).href; } catch { return null; }
    };

    // 1. apple-touch-icon (best quality, square, used by iOS)
    const appleMatch = html.match(/<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]*href=["']([^"']+)["']/i)
      || html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon(?:-precomposed)?["']/i);
    if (appleMatch?.[1]) return NextResponse.json({ icon: resolve(appleMatch[1]) });

    // 2. <link rel="icon"> with large size (≥ 96px)
    const iconTags = [...html.matchAll(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/gi)].map(m => m[0]);
    let bestIcon = null;
    let bestSize = 0;
    for (const tag of iconTags) {
      const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
      const sizesMatch = tag.match(/sizes=["'](\d+)x\d+["']/i);
      if (!hrefMatch) continue;
      const size = sizesMatch ? parseInt(sizesMatch[1]) : 0;
      if (size > bestSize) { bestSize = size; bestIcon = resolve(hrefMatch[1]); }
    }
    if (bestIcon && bestSize >= 96) return NextResponse.json({ icon: bestIcon });

    // 3. og:image (usually a good square logo)
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch?.[1]) return NextResponse.json({ icon: resolve(ogMatch[1]) });

    // 4. Any icon found (even small)
    if (bestIcon) return NextResponse.json({ icon: bestIcon });

    // 5. Fallback: /favicon.ico
    const faviconUrl = `${origin}/favicon.ico`;
    const faviconRes = await fetch(faviconUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
    if (faviconRes.ok) return NextResponse.json({ icon: faviconUrl });

    // 6. No icon found — let the client render its own placeholder.
    return NextResponse.json({ icon: null });

  } catch {
    // Network error — let the client render its own placeholder.
    return NextResponse.json({ icon: null });
  }
}
