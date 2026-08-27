// AfriLaunch AI — Login API
// POST /api/auth/login — authenticate user, create session, set cookie.

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createUserSession, sanitizeUser } from '@/lib/user-store';
import { USER_COOKIE_OPTIONS } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    const { email, password } = body as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 },
      );
    }

    const user = await authenticateUser(String(email), String(password));
    if (!user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 },
      );
    }

    const token = await createUserSession(user.id);
    const res = NextResponse.json({
      ok: true,
      user: sanitizeUser(user),
      token,
    });
    res.cookies.set('afrilaunch_user', token, USER_COOKIE_OPTIONS);
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
