// AfriLaunch AI — Telegram link API
// POST /api/users/telegram-link — link a Telegram account to the current user.

import { NextRequest, NextResponse } from 'next/server';
import { linkTelegramAccount, sanitizeUser } from '@/lib/user-store';
import { requireUser } from '@/lib/auth-helpers';

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

    const { telegramUserId, telegramUsername } = body as {
      telegramUserId?: number | string;
      telegramUsername?: string;
    };

    if (telegramUserId === undefined || telegramUserId === null || !telegramUsername) {
      return NextResponse.json(
        { error: 'Champs requis manquants: telegramUserId, telegramUsername' },
        { status: 400 },
      );
    }

    const tgId = typeof telegramUserId === 'string' ? parseInt(telegramUserId, 10) : telegramUserId;
    if (!Number.isFinite(tgId)) {
      return NextResponse.json({ error: 'telegramUserId invalide' }, { status: 400 });
    }

    const updated = await linkTelegramAccount(user.id, tgId, String(telegramUsername));
    if (!updated) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: sanitizeUser(updated) });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
