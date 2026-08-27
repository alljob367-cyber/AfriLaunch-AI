// AfriLaunch AI — Seed mock ads data (for demo)
// POST /api/ads/seed — populate inbox with mock comments/messages

import { NextRequest, NextResponse } from 'next/server';
import { seedMockAdsData } from '@/lib/ads-store';
import { requireUser } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await seedMockAdsData();
  return NextResponse.json({ ok: true, message: 'Mock data seeded' });
}
