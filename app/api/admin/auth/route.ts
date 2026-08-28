// AfriLaunch AI — Admin auth API
// POST /api/admin/auth/login  — login with password, returns session token
//                               ALSO creates a user session for the admin
//                               (so the admin can use the dashboard with
//                               unlimited credits, no payment wall)
// POST /api/admin/auth/logout — destroy both sessions
// GET  /api/admin/auth/check  — validate current admin session

import { NextRequest, NextResponse } from 'next/server';
import { getConfig, verifyPassword, createSession, destroySession, validateSession } from '@/lib/config-store';
import { ensureAdminUser, createUserSession, sanitizeUser } from '@/lib/user-store';
import { USER_COOKIE_OPTIONS } from '@/lib/auth-helpers';

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

    // 1. Create admin session (for /admin/* pages)
    const adminToken = await createSession(config.auth.sessionExpiryHours);

    // 2. ALSO create a user session for the admin (so they can use /dashboard/*
    //    without paying — admin gets unlimited credits + enterprise plan)
    const adminUser = await ensureAdminUser(password);
    const userToken = await createUserSession(adminUser.id, config.auth.sessionExpiryHours);

    const res = NextResponse.json({
      ok: true,
      token: adminToken,
      user: sanitizeUser(adminUser),
      userToken,
      message: 'Connecté en tant qu\'admin — accès illimité au dashboard activé',
    });
    // Admin cookie (for /admin/* pages)
    res.cookies.set('afrilaunch_admin', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: config.auth.sessionExpiryHours * 3600,
      path: '/',
    });
    // User cookie (for /dashboard/* pages — admin bypasses payment wall)
    res.cookies.set('afrilaunch_user', userToken, USER_COOKIE_OPTIONS);
    return res;
  }

  if (action === 'logout') {
    // Destroy admin session
    const adminToken = req.cookies.get('afrilaunch_admin')?.value;
    if (adminToken) await destroySession(adminToken);
    // Also destroy user session (admin was logged in as user too)
    const userToken = req.cookies.get('afrilaunch_user')?.value;
    if (userToken) {
      const { destroyUserSession } = await import('@/lib/user-store');
      await destroyUserSession(userToken);
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.delete('afrilaunch_admin');
    res.cookies.delete('afrilaunch_user');
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
