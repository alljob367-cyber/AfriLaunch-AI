// AfriLaunch AI — Flutterwave webhook
// POST /api/checkout/flutterwave-webhook — verifies `verif-hash` header against the
// Flutterwave secret key, then applies plan changes or credit top-ups.

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { addCredits, changeUserPlan, CREDIT_PACKS, type PlanId } from '@/lib/user-store';

interface FlutterwaveEvent {
  event?: string;
  data?: {
    status?: string;
    meta?: {
      userId?: string;
      type?: string;
      itemId?: string;
    } | null;
  };
}

async function applyFulfillment(userId: string, type: string, itemId: string): Promise<void> {
  if (type === 'plan') {
    await changeUserPlan(userId, itemId as PlanId);
  } else if (type === 'pack') {
    const pack = CREDIT_PACKS.find((p) => p.id === itemId);
    if (pack) {
      await addCredits(userId, pack.credits);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const config = await getConfig();
    const fw = config.payments.providers.flutterwave;

    if (!fw.enabled || !fw.secretKey) {
      return NextResponse.json(
        { error: 'Flutterwave non configuré' },
        { status: 500 },
      );
    }

    const verifHash = req.headers.get('verif-hash');
    if (!verifHash) {
      return NextResponse.json(
        { error: 'En-tête verif-hash manquant' },
        { status: 401 },
      );
    }

    // Constant-time comparison
    const a = Buffer.from(fw.secretKey);
    const b = Buffer.from(verifHash);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Signature Flutterwave invalide' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as FlutterwaveEvent | null;
    if (!body) {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    // Flutterwave successful charge events come as `charge.completed` (or similar).
    const isSuccessful =
      body.event === 'charge.completed' ||
      body.event === 'transfer.completed' ||
      body.data?.status === 'successful' ||
      body.data?.status === 'completed';

    if (!isSuccessful) {
      // Not a successful payment — acknowledge but do nothing.
      return NextResponse.json({ ok: true, applied: false });
    }

    const meta = body.data?.meta ?? null;
    const userId = meta?.userId ?? '';
    const type = meta?.type ?? '';
    const itemId = meta?.itemId ?? '';

    if (userId && type && itemId) {
      await applyFulfillment(userId, type, itemId);
      return NextResponse.json({ ok: true, applied: true });
    }

    return NextResponse.json({ ok: true, applied: false });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
