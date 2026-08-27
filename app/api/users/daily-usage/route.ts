// AfriLaunch AI — Daily usage endpoint
// GET /api/users/daily-usage — returns today's usage for the authenticated user

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getDailyUsage } from '@/lib/user-store';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const usage = await getDailyUsage(user.id);
  return NextResponse.json({ ok: true, ...usage });
}
