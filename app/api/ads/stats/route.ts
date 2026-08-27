// AfriLaunch AI — Ads stats API
// GET /api/ads/stats — aggregate stats

import { NextRequest, NextResponse } from 'next/server';
import { getAdsStats } from '@/lib/ads-store';
import { requireUser } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const stats = await getAdsStats();
  return NextResponse.json({ ok: true, stats });
}
