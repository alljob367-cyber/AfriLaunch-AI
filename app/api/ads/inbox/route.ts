// AfriLaunch AI — Ads inbox API
// GET /api/ads/inbox — list items (with filters)

import { NextRequest, NextResponse } from 'next/server';
import { getAdsItems, type AdsPlatform, type ItemType, type ResponseStatus } from '@/lib/ads-store';
import { requireUser } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const url = new URL(req.url);
  const platform = url.searchParams.get('platform') as AdsPlatform | null;
  const type = url.searchParams.get('type') as ItemType | null;
  const status = url.searchParams.get('status') as ResponseStatus | null;
  const unreadOnly = url.searchParams.get('unread') === '1';
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);

  const items = await getAdsItems({
    platform: platform || undefined,
    type: type || undefined,
    status: status || undefined,
    unreadOnly: unreadOnly || undefined,
    limit,
  });

  return NextResponse.json({ ok: true, items, count: items.length });
}
