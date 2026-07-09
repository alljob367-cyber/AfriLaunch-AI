// AfriLaunch AI — Admin auth API
// POST /api/admin/auth/login  — login with password, returns session token
// POST /api/admin/auth/logout — destroy session
// GET  /api/admin/auth/check  — validate current session

import { NextRequest, NextResponse } from 'next/server';
import { getConfig, verifyPassword, createSession, destroySession, validateSession } from '@/lib/config-store';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? 'login';

  if (action === 'login') {
    let body: { password?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }
    const password = body.password;
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 });
    }

    const config = await getConfig();
    if (!verifyPassword(password, config.adminPasswordHash)) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    const token = await createSession(config.auth.sessionExpiryHours);
    const res = NextResponse.json({ ok: true, token });
    res.cookies.set('afrilaunch_admin', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: config.auth.sessionExpiryHours * 3600,
      path: '/',
    });
    return res;
  }

  if (action === 'logout') {
    const token = req.cookies.get('afrilaunch_admin')?.value;
    if (token) await destroySession(token);
    const res = NextResponse.json({ ok: true });
    res.cookies.delete('afrilaunch_admin');
    return res;
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return NextResponse.json({ authenticated: false });
  const valid = await validateSession(token);
  return NextResponse.json({ authenticated: valid });
}
