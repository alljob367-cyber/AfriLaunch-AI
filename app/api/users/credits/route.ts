// AfriLaunch AI — User credits API
// GET  /api/users/credits — return the user's credit info.
// POST /api/users/credits — consume credits { amount, reason? }.

import { NextRequest, NextResponse } from 'next/server';
import { consumeCredits, sanitizeUser } from '@/lib/user-store';
import { requireUser } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    return NextResponse.json({
      credits: user.credits,
      creditsUsedThisMonth: user.creditsUsedThisMonth,
      plan: user.plan,
      creditsResetAt: user.creditsResetAt,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    const { amount, reason } = body as { amount?: number; reason?: string };
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: '`amount` doit être un nombre positif' },
        { status: 400 },
      );
    }

    const result = await consumeCredits(user.id, Math.floor(amount));
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, credits: result.user?.credits ?? 0, error: result.error },
        { status: 402 },
      );
    }

    return NextResponse.json({
      ok: true,
      credits: result.user?.credits ?? 0,
      user: result.user ? sanitizeUser(result.user) : null,
      reason: reason ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
