// AfriLaunch AI — Current user API
// GET /api/auth/me — return the currently authenticated user.
// Marked dynamic + no-store so the user object is always fresh (credits change fast).

import { NextRequest, NextResponse } from 'next/server';
import { sanitizeUser } from '@/lib/user-store';
import { requireUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      const res = NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      res.headers.set('Cache-Control', 'no-store, max-age=0');
      return res;
    }
    const res = NextResponse.json({ user: sanitizeUser(user) });
    // User object changes when credits are consumed — never cache.
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
