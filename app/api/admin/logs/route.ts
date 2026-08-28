// AfriLaunch AI — Admin logs API
// GET /api/admin/logs?limit=15&level=info
//
// NOTE: The current logger (lib/logger.ts) writes to console only — no
// persistent sink yet. This endpoint returns an empty array with an
// honest message rather than mock data. Once a persistent logger is
// wired (Sentry, Loki, or a DB table), this endpoint will return real
// entries automatically.

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/config-store';

async function requireAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
  const level = url.searchParams.get('level'); // 'info' | 'warn' | 'error' | null

  // No persistent log backend yet — return empty list.
  // When a sink is added (DB table or Sentry), replace the array below
  // with a real query.
  return NextResponse.json({
    ok: true,
    logs: [],
    limit,
    level: level || 'all',
    note: 'Aucun log persistant pour le moment. Les logs sont envoyés vers la console Vercel (Logs > Functions). Une intégration Sentry/DB est prévue pour la persistance.',
  });
}
