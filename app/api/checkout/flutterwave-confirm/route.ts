// AfriLaunch AI — Flutterwave confirm (simulated)
// POST /api/checkout/flutterwave-confirm — applies the plan change / credit top-up
// for the simulated Flutterwave checkout, then redirects to the dashboard.

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { addCredits, changeUserPlan, CREDIT_PACKS, type PlanId } from '@/lib/user-store';

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

    // Form-encoded body (HTML form POST)
    const form = await req.formData().catch(() => null);
    const get = (key: string): string => {
      const v = form?.get(key);
      return v == null ? '' : String(v);
    };

    const type = get('type');
    const itemId = get('itemId');
    const userId = get('userId');

    // Also accept JSON for convenience
    let parsed: { type?: string; itemId?: string; userId?: string } | null = null;
    if (!form) {
      try {
        parsed = await req.json();
      } catch { /* not JSON either */ }
    }
    const t = type || parsed?.type || '';
    const i = itemId || parsed?.itemId || '';
    const u = userId || parsed?.userId || '';

    if (!u || !t || !i) {
      return NextResponse.json(
        { ok: false, error: 'Paramètres manquants: type, itemId, userId' },
        { status: 400 },
      );
    }

    await applyFulfillment(u, t, i);

    return NextResponse.redirect(
      new URL('/dashboard/subscription?success=1', config.appUrl || req.url),
      { status: 303 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
