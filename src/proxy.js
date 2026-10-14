import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/explore', '/pulse', '/learn'];
const authRoutes = ['/login', '/signup', '/forgot-password'];

// Routes that don't require auth (matched by prefix)
const publicPrefixes = ['/blog/', '/profile/', '/reset-password/', '/learn/'];

// API routes that don't require auth
const publicApiPrefixes = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/me',
  '/api/posts',
  '/api/series',
  '/api/feed',
  '/api/search',
  '/api/users',
  '/api/categories',
  '/api/billing/webhook',
  '/api/news',
  '/api/cron',
  '/api/contact',
  '/api/mcp',
];

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  
  // Exclude static files, images, oauth, and well-known configuration routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/oauth') || pathname.startsWith('/.well-known') || pathname.includes('.') || pathname.startsWith('/api/billing/webhook')) {
    return NextResponse.next();
  }

  // Allow API requests with Bearer API key tokens or query param apiKeys through — actual validation in route handlers
  const isApiRoute = pathname.startsWith('/api');
  if (isApiRoute) {
    const authHeader = req.headers.get('authorization');
    const apiKeyParam = req.nextUrl.searchParams.get('apiKey');
    if (authHeader?.startsWith('Bearer bw_') || apiKeyParam?.startsWith('bw_')) {
      return NextResponse.next();
    }
  }

  const isPublicRoute = publicRoutes.includes(pathname) || publicPrefixes.some(p => pathname.startsWith(p));
  const isAuthRoute = authRoutes.includes(pathname);

  const token = req.cookies.get('auth_token')?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session && !isPublicRoute) {
    if (isApiRoute) {
      if (publicApiPrefixes.some(p => pathname.startsWith(p))) {
        return NextResponse.next();
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Admin route protection
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!session) {
      return pathname.startsWith('/api') 
        ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', req.url));
    }
    // Admin check will be done at the API/page level with DB lookup
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
