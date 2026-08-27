// AfriLaunch AI — Manual payment create API
// POST /api/payment-manual/create — create a new pending manual payment order.
// Body: { type: 'plan'|'pack', itemId: string, country: string, method: PaymentMethod }

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { createManualPaymentOrder, type PaymentMethod } from '@/lib/payment-manual';

interface CreateBody {
  type: 'plan' | 'pack';
  itemId: string;
  country: string;
  method: PaymentMethod;
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

    const { type, itemId, country, method } = body as CreateBody;

    if (!type || !itemId || !country || !method) {
      return NextResponse.json(
        { error: 'Champs requis manquants: type, itemId, country, method' },
        { status: 400 },
      );
    }

    if (type !== 'plan' && type !== 'pack') {
      return NextResponse.json(
        { error: "`type` doit être 'plan' ou 'pack'" },
        { status: 400 },
      );
    }

    const result = await createManualPaymentOrder({
      userId: user.id,
      userEmail: user.email,
      userName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      type,
      itemId,
      country,
      method,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, order: result.order });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
