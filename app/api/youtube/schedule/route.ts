// AfriLaunch AI — YouTube schedule config (per-user)
// GET /api/youtube/schedule → returns user's schedule config
// PUT /api/youtube/schedule → updates schedule config

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getUserSchedule, upsertUserSchedule } from '@/lib/youtube-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const schedule = await getUserSchedule(user.id);
  return NextResponse.json({ ok: true, schedule });
}

export async function PUT(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const allowed = [
    'enabled', 'activeDays', 'publishTime', 'timezone', 'frequency',
    'autoNotifyEmail', 'autoNotifyWhatsApp', 'maxVideosPerWeek',
  ] as const;
  const updates: any = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  // Validate activeDays
  if (updates.activeDays && !Array.isArray(updates.activeDays)) {
    updates.activeDays = [1, 3, 5];
  } else if (updates.activeDays) {
    updates.activeDays = updates.activeDays.filter((d: number) => d >= 0 && d <= 6);
  }

  // Validate maxVideosPerWeek
  if (updates.maxVideosPerWeek !== undefined) {
    updates.maxVideosPerWeek = Math.min(7, Math.max(1, Number(updates.maxVideosPerWeek) || 3));
  }

  const schedule = await upsertUserSchedule(user.id, updates);
  return NextResponse.json({ ok: true, schedule });
}
