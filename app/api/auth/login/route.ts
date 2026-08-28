// AfriLaunch AI — Login API
// POST /api/auth/login — authenticate user, create session, set cookie.
// Special case: if the email is an admin email, auto-provision the admin user
// with unlimited access (so the admin can login here too, not just via /admin/login).

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateUser, createUserSession, sanitizeUser, ensureAdminUser, getUserByEmail,
} from '@/lib/user-store';
import { USER_COOKIE_OPTIONS } from '@/lib/auth-helpers';
import { getConfig, verifyPassword } from '@/lib/config-store';

const ADMIN_EMAILS = new Set(['admin@albermon.com', 'admin@afrilaunch.ai']);

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

    const normalizedEmail = String(email).toLowerCase().trim();

    // ─── Admin email login path ────────────────────────────────────
    // If the user is logging in with an admin email, accept the admin panel
    // password (Albermon2026! by default, or the custom one if set).
    // This lets the admin login from /login (not just /admin/login).
    if (ADMIN_EMAILS.has(normalizedEmail)) {
      const config = await getConfig();
      if (verifyPassword(String(password), config.adminPasswordHash)) {
        // Password matches admin panel password → provision + login as admin
        const adminUser = await ensureAdminUser(String(password));
        const token = await createUserSession(adminUser.id);
        const res = NextResponse.json({
          ok: true,
          user: sanitizeUser(adminUser),
          token,
          isAdmin: true,
        });
        res.cookies.set('afrilaunch_user', token, USER_COOKIE_OPTIONS);
        return res;
      }
      // If admin password doesn't match, fall through to normal auth
      // (the admin user might have a different user-store password).
    }

    // ─── Normal user login path ────────────────────────────────────
    const user = await authenticateUser(normalizedEmail, String(password));
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
