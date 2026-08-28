// AfriLaunch AI — List user's published sites
// GET /api/sites/list → { ok, sites: [...] }

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getUserSites, sanitizeSite } from '@/lib/sites-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBaseUrl(req: NextRequest): string {
  const vercelUrl = req.headers.get('x-vercel-url');
  if (vercelUrl) return `https://${vercelUrl}`;
  const url = new URL(req.url);
  return url.origin;
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const sites = await getUserSites(user.id);
  const baseUrl = getBaseUrl(req);

  return NextResponse.json({
    ok: true,
    sites: sites.map((s) => ({ ...sanitizeSite(s), url: `${baseUrl}/s/${s.slug}` })),
  });
}
