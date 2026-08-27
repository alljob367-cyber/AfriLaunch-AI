// AfriLaunch AI — Logout API
// POST /api/auth/logout — destroy session and clear cookie.

import { NextRequest, NextResponse } from 'next/server';
import { destroyUserSession } from '@/lib/user-store';
import { USER_COOKIE_OPTIONS } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('afrilaunch_user')?.value;
    if (token) {
      await destroyUserSession(token);
    }
    const res = NextResponse.json({ ok: true });
    // Clear the cookie by setting maxAge=0
    res.cookies.set('afrilaunch_user', '', { ...USER_COOKIE_OPTIONS, maxAge: 0 });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
