// AfriLaunch AI — Register API
// POST /api/auth/register — register a new user, create session, set cookie.

import { NextRequest, NextResponse } from 'next/server';
import { createUser, createUserSession, sanitizeUser } from '@/lib/user-store';
import { USER_COOKIE_OPTIONS } from '@/lib/auth-helpers';
import {
  validateEmail, validatePassword, validateFirstName, validateReferralCode,
} from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    // ─── Validate inputs ─────────────────────────────────────────────
    const emailCheck = validateEmail((body as Record<string, unknown>).email);
    if (!emailCheck.ok) return NextResponse.json({ error: emailCheck.error }, { status: 400 });

    const firstNameCheck = validateFirstName((body as Record<string, unknown>).firstName);
    if (!firstNameCheck.ok) return NextResponse.json({ error: firstNameCheck.error }, { status: 400 });

    const lastNameRaw = (body as Record<string, unknown>).lastName;
    const lastName = (typeof lastNameRaw === 'string' && lastNameRaw.trim())
      ? lastNameRaw.trim().slice(0, 80) : undefined;

    const passwordCheck = validatePassword((body as Record<string, unknown>).password);
    if (!passwordCheck.ok) return NextResponse.json({ error: passwordCheck.error }, { status: 400 });

    const referralCheck = validateReferralCode((body as Record<string, unknown>).referredBy);
    if (!referralCheck.ok) return NextResponse.json({ error: referralCheck.error }, { status: 400 });

    // ─── Create user ─────────────────────────────────────────────────
    const result = await createUser({
      email: emailCheck.value!,
      firstName: firstNameCheck.value!,
      lastName,
      password: passwordCheck.value!,
      referredBy: referralCheck.value,
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
    console.error('[register] error:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
