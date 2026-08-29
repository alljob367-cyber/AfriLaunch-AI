// AfriLaunch AI — Middleware
// 1. Route protection: /admin/* (except /admin/login) requires admin cookie.
//    /dashboard/* requires user cookie.
//    The actual session validation happens in the API routes / page layouts —
//    the middleware only checks cookie PRESENCE so we can short-circuit the
//    99% case (anonymous visitor hitting /dashboard) before rendering the
//    client bundle. Real validation still happens server-side via
//    validateUserSession / validateSession.
// 2. Security headers on all responses.
// 3. Optional: simple IP-based rate limiting on /api/auth/* and /api/admin/auth.

import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_LOGIN_PATH = '/admin/login';
const USER_LOGIN_PATH = '/login';

function hasCookie(req: NextRequest, name: string): boolean {
  const c = req.cookies.get(name);
  return !!c && c.value.length > 0;
}

// ─── Security headers ────────────────────────────────────────────────
function applySecurityHeaders(res: NextResponse, req: NextRequest): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Permissive CSP (Next.js inline styles + eval in dev). Tighten in prod.
  // 'unsafe-inline' is required for Next.js styled-jsx + Tailwind.
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob: https:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https:",
    ].join('; '),
  );
  // HSTS only on HTTPS (skip on localhost / HTTP preview)
  if (req.nextUrl.protocol === 'https:') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  return res;
}

// ─── Rate limiting (in-memory, per-instance) ─────────────────────────
// NOTE: In a multi-instance deploy (Vercel), this only rate-limits per
// instance. For real distributed rate limiting, use Upstash Ratelimit.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 attempts per minute per IP on auth endpoints
const ipHits = new Map<string, { count: number; resetAt: number }>();

function rateLimitCheck(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }
  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

// Periodically clean up the map to avoid memory leaks
let lastCleanup = Date.now();
function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60_000) return;
  lastCleanup = now;
  for (const [k, v] of ipHits) {
    if (v.resetAt < now) ipHits.delete(k);
  }
}

function getClientIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const xr = req.headers.get('x-real-ip');
  if (xr) return xr;
  return 'unknown';
}

// ─── Public entry: default export as `proxy` (Next.js 16 convention) ──
// Previous name was `middleware`; Next.js 16 renamed it to `proxy`.
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── 1. Rate limit auth endpoints ──────────────────────────────────
  cleanupRateLimitMap();
  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/admin/auth')
  ) {
    const ip = getClientIp(req);
    const { allowed, retryAfterMs } = rateLimitCheck(ip);
    if (!allowed) {
      const res = NextResponse.json(
        { ok: false, error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
        { status: 429 },
      );
      res.headers.set('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
      return applySecurityHeaders(res, req);
    }
  }

  // ─── 2. Protect /admin/* (except /admin/login) ─────────────────────
  if (pathname.startsWith('/admin') && pathname !== ADMIN_LOGIN_PATH) {
    if (!hasCookie(req, 'afrilaunch_admin')) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = ADMIN_LOGIN_PATH;
      loginUrl.search = '';
      return applySecurityHeaders(NextResponse.redirect(loginUrl, 307), req);
    }
  }

  // ─── 3. Protect /dashboard/* ───────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!hasCookie(req, 'afrilaunch_user')) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = USER_LOGIN_PATH;
      loginUrl.search = '';
      return applySecurityHeaders(NextResponse.redirect(loginUrl, 307), req);
    }
  }

  // ─── 4. Apply security headers to all other responses ──────────────
  return applySecurityHeaders(NextResponse.next(), req);
}

export const config = {
  // Run middleware on all routes except Next.js internals + static assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|logo-pro.jpg|landing-pro.jpg|robots.txt|sitemap.xml|manifest.json|sw.js|og-image.png|admin/login).*)',
  ],
};
