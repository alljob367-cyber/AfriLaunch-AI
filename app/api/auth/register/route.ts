// AfriLaunch AI — Register API
// POST /api/auth/register — register a new user, create session, set cookie.

import { NextRequest, NextResponse } from 'next/server';
import { createUser, createUserSession, sanitizeUser } from '@/lib/user-store';
import { USER_COOKIE_OPTIONS } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    const { email, firstName, lastName, password, referredBy } = body as {
      email?: string;
      firstName?: string;
      lastName?: string;
      password?: string;
      referredBy?: string;
    };

    if (!email || !firstName || !password) {
      return NextResponse.json(
        { error: 'Champs requis manquants: email, firstName, password' },
        { status: 400 },
      );
    }

    const result = await createUser({
      email: String(email),
      firstName: String(firstName),
      lastName: lastName ? String(lastName) : undefined,
      password: String(password),
      referredBy: referredBy ? String(referredBy) : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const token = await createUserSession(result.user.id);
    const res = NextResponse.json({
      ok: true,
      user: sanitizeUser(result.user),
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
