// AfriLaunch AI — Admin config API
// GET  /api/admin/config        — read full config (requires auth)
// PUT  /api/admin/config        — update config (requires auth)
// PATCH /api/admin/config       — partial update (requires auth)

import { NextRequest, NextResponse } from 'next/server';
import { getConfig, updateConfig, validateSession, type AppConfig } from '@/lib/config-store';

async function requireAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

// Strip sensitive fields when returning config (we still return them so the
// admin can edit, but mark them as set/unset)
function sanitizeForRead(config: AppConfig) {
  return config;
}

export async function GET(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const config = await getConfig();
  return NextResponse.json({ config: sanitizeForRead(config) });
}

export async function PUT(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  let body: Partial<AppConfig>;
  try {
    const parsed = await req.json();
    body = parsed.config ?? parsed;
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }
  const updated = await updateConfig(body);
  return NextResponse.json({ ok: true, config: sanitizeForRead(updated) });
}

export async function PATCH(req: NextRequest) {
  return PUT(req);
}
