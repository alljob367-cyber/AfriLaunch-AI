// AfriLaunch AI — Current user API
// GET /api/auth/me — return the currently authenticated user.

import { NextRequest, NextResponse } from 'next/server';
import { sanitizeUser } from '@/lib/user-store';
import { requireUser } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
