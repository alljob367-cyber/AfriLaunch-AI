// AfriLaunch AI — Login API
// POST /api/auth/login — authenticate user, create session, set cookie.
// Special case: if the email is an admin email, auto-provision the admin user
// with unlimited access (so the admin can login here too, not just via /admin/login).

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateUser, createUserSession, sanitizeUser, ensureAdminUser,
} from '@/lib/user-store';
import { USER_COOKIE_OPTIONS } from '@/lib/auth-helpers';
import { getConfig, verifyPassword } from '@/lib/config-store';
import { validateEmail, validateString } from '@/lib/validators';

const ADMIN_EMAILS = new Set(['admin@albermon.com', 'admin@afrilaunch.ai']);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    // ─── Validate inputs ─────────────────────────────────────────────
    const emailCheck = validateEmail((body as Record<string, unknown>).email);
    if (!emailCheck.ok) return NextResponse.json({ error: emailCheck.error }, { status: 400 });

    const passwordCheck = validateString((body as Record<string, unknown>).password, {
      field: 'Mot de passe', min: 1, max: 256,
    });
    if (!passwordCheck.ok) return NextResponse.json({ error: passwordCheck.error }, { status: 400 });

    const normalizedEmail = emailCheck.value!;

    // ─── Admin email login path ────────────────────────────────────
    if (ADMIN_EMAILS.has(normalizedEmail)) {
      const config = await getConfig();
      if (verifyPassword(passwordCheck.value!, config.adminPasswordHash)) {
        const adminUser = await ensureAdminUser(passwordCheck.value!);
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
    }

    // ─── Normal user login path ────────────────────────────────────
    const user = await authenticateUser(normalizedEmail, passwordCheck.value!);
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
    console.error('[login] error:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
