import { NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import net from 'node:net';

const MAX_HTML_BYTES = 1024 * 1024;
const MAX_REDIRECTS = 3;

/** True for loopback, private, link-local, CGNAT, multicast and reserved addresses. */
function isBlockedAddress(address) {
  let ip = address.toLowerCase();
  if (ip.startsWith('::ffff:')) ip = ip.slice(7); // IPv4-mapped IPv6
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 192 && b === 0)
      || (a === 198 && (b === 18 || b === 19));
  }
  return ip === '::' || ip === '::1' || /^f[cd]/.test(ip) || /^fe[89ab]/.test(ip) || ip.startsWith('ff');
}

/** Rejects anything but http(s) to a public host on the default ports. */
async function assertPublicUrl(url) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocol');
  if (url.port && url.port !== '80' && url.port !== '443') throw new Error('port');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addresses.length || addresses.some(a => isBlockedAddress(a.address))) throw new Error('blocked');
}

/**
 * fetch() for user-supplied URLs: every hop (redirects included) must be a
 * public address, and at most MAX_HTML_BYTES of the body is read.
 */
async function safeFetch(rawUrl, { method = 'GET', timeoutMs = 6000 } = {}) {
  let url = new URL(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url);
    const res = await fetch(url.href, {
      method,
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlogWrite/1.0)' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location'), url);
      continue;
    }
    return res;
  }
  throw new Error('too many redirects');
}

async function readCapped(res) {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_HTML_BYTES) { await reader.cancel(); break; }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf8');
}

/**
 * GET /api/favicon?url=https://example.com
 * Returns the best icon URL found for the given site.
 * Priority: apple-touch-icon → high-res link[rel=icon] → og:image → /favicon.ico
 * Only public web addresses are fetched (no private, loopback or metadata
 * addresses, no other ports), redirects are re-checked, and the page read is
 * capped at 1 MB.
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
    const html = await readCapped(await safeFetch(siteUrl.href));

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
    const faviconRes = await safeFetch(faviconUrl, { method: 'HEAD', timeoutMs: 3000 });
    if (faviconRes.ok) return NextResponse.json({ icon: faviconUrl });

    // 6. No icon found — let the client render its own placeholder.
    return NextResponse.json({ icon: null });

  } catch {
    // Network error — let the client render its own placeholder.
    return NextResponse.json({ icon: null });
  }
}
