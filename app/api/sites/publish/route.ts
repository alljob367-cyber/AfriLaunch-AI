// AfriLaunch AI — Publish a generated website
// POST /api/sites/publish { html, title }
// → { ok, site: { id, slug, url }, url }
//
// Plan restriction: only 'business' and 'enterprise' plans can publish sites
// to a public URL. Lower plans (starter, pro) get a 403 with a clear message
// directing them to upgrade.

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { publishSite, sanitizeSite } from '@/lib/sites-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Plans allowed to publish sites publicly
const ALLOWED_PLANS = new Set(['business', 'enterprise']);

function getBaseUrl(req: NextRequest): string {
  // Vercel sets this header automatically
  const vercelUrl = req.headers.get('x-vercel-url');
  if (vercelUrl) return `https://${vercelUrl}`;
  // Fallback to request URL origin
  const url = new URL(req.url);
  return url.origin;
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // Plan gate — admin bypass
  const isAdmin = (user as any).isAdmin === true || user.email === 'admin@albermon.com' || user.email === 'admin@afrilaunch.ai';
  if (!isAdmin && !ALLOWED_PLANS.has(user.plan)) {
    return NextResponse.json({
      ok: false,
      error: 'La publication de site en ligne est réservée au plan Business. Passez à Business ou Enterprise pour débloquer cette fonctionnalité.',
      upgradeRequired: true,
      currentPlan: user.plan,
      requiredPlans: ['business', 'enterprise'],
    }, { status: 403 });
  }

  let body: { html?: string; title?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const html = (body.html || '').trim();
  const title = (body.title || '').trim() || 'Mon site';

  if (!html) {
    return NextResponse.json({ error: 'HTML manquant' }, { status: 400 });
  }

  const result = await publishSite(user.id, html, title);
  if (!result.ok || !result.site) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const baseUrl = getBaseUrl(req);
  const url = `${baseUrl}/s/${result.site.slug}`;

  return NextResponse.json({
    ok: true,
    site: sanitizeSite(result.site),
    url,
  });
}
