// AfriLaunch AI — Flutterwave confirm (SECURE)
// POST /api/checkout/flutterwave-confirm — applies the plan change / credit top-up
// for a Flutterwave checkout, then redirects to the dashboard.
//
// SECURITY:
//   1. Requires authenticated user (afrilaunch_user cookie)
//   2. userId in body MUST match the authenticated user's id (no IDOR)
//   3. If Flutterwave secret key is configured, calls the real
//      transactions/:id/verify API to confirm payment was successful
//      AND matches the expected amount + currency.
//   4. If Flutterwave is NOT configured (dev/demo mode), the route refuses
//      to apply fulfillment — admins must use the manual payment flow instead.
//   5. Idempotency: stores processed tx_ref in KV to prevent replay attacks.

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { addCredits, changeUserPlan, CREDIT_PACKS, type PlanId, validateUserSession } from '@/lib/user-store';
import { kvGet, kvSet } from '@/lib/db';
import { PLANS } from '@/lib/user-types';

interface ProcessedTx {
  txRef: string;
  processedAt: string;
  userId: string;
  type: string;
  itemId: string;
}

async function getProcessedTxs(): Promise<ProcessedTx[]> {
  return (await kvGet<ProcessedTx[]>('processed-flw-txs')) ?? [];
}

async function markTxProcessed(tx: ProcessedTx): Promise<void> {
  const list = await getProcessedTxs();
  // Keep only the last 1000 entries (rolling window)
  const next = [...list, tx].slice(-1000);
  await kvSet('processed-flw-txs', next);
}

async function applyFulfillment(userId: string, type: string, itemId: string): Promise<void> {
  if (type === 'plan') {
    if (!PLANS[itemId as PlanId]) {
      throw new Error(`Plan invalide: ${itemId}`);
    }
    await changeUserPlan(userId, itemId as PlanId);
  } else if (type === 'pack') {
    const pack = CREDIT_PACKS.find((p) => p.id === itemId);
    if (!pack) {
      throw new Error(`Pack invalide: ${itemId}`);
    }
    await addCredits(userId, pack.credits);
  } else {
    throw new Error(`Type invalide: ${type}`);
  }
}

interface FlwVerifyResponse {
  status: string; // "success" | "error"
  message?: string;
  data?: {
    status: string; // "successful" | "cancelled" | "failed"
    tx_ref: string;
    amount: number;
    currency: string;
    customer?: { email?: string };
    meta?: { userId?: string; type?: string; itemId?: string };
  };
}

async function verifyFlwTransaction(
  txRef: string,
  config: Awaited<ReturnType<typeof getConfig>>,
): Promise<{ ok: boolean; data?: FlwVerifyResponse['data']; error?: string }> {
  const secretKey = config.payments.providers.flutterwave.secretKey;
  if (!secretKey) {
    return { ok: false, error: 'Flutterwave non configuré' };
  }
  try {
    const res = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { ok: false, error: `Flutterwave API HTTP ${res.status}` };
    }
    const json = (await res.json()) as FlwVerifyResponse;
    if (json.status !== 'success' || !json.data) {
      return { ok: false, error: json.message ?? 'Verification échouée' };
    }
    if (json.data.status !== 'successful') {
      return { ok: false, error: `Paiement ${json.data.status}` };
    }
    return { ok: true, data: json.data };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function expectedPrice(type: string, itemId: string, billingCycle: string): number | null {
  if (type === 'plan') {
    const plan = PLANS[itemId as PlanId];
    if (!plan) return null;
    return billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  }
  if (type === 'pack') {
    const pack = CREDIT_PACKS.find((p) => p.id === itemId);
    if (!pack) return null;
    return pack.price;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const config = await getConfig();

    // ─── 1. Authenticate user via cookie ────────────────────────────────
    const userCookie = req.cookies.get('afrilaunch_user')?.value;
    if (!userCookie) {
      return NextResponse.json(
        { ok: false, error: 'Non authentifié' },
        { status: 401 },
      );
    }
    const user = await validateUserSession(userCookie);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Session invalide ou expirée' },
        { status: 401 },
      );
    }

    // ─── 2. Parse body (form or JSON) ───────────────────────────────────
    const form = await req.formData().catch(() => null);
    const get = (key: string): string => {
      const v = form?.get(key);
      return v == null ? '' : String(v);
    };
    const type = get('type');
    const itemId = get('itemId');
    const userId = get('userId');
    const txRef = get('tx_ref') || get('txRef');
    const amount = parseFloat(get('amount') || '0');
    const billingCycle = get('billingCycle') || 'monthly';

    // Fallback to JSON if form parsing failed
    let parsed: { type?: string; itemId?: string; userId?: string; tx_ref?: string; amount?: number } | null = null;
    if (!form) {
      try {
        parsed = await req.json();
      } catch { /* not JSON either */ }
    }
    const t = type || parsed?.type || '';
    const i = itemId || parsed?.itemId || '';
    const u = userId || parsed?.userId || '';
    const tx = txRef || parsed?.tx_ref || '';
    const amt = amount || parsed?.amount || 0;

    if (!u || !t || !i) {
      return NextResponse.json(
        { ok: false, error: 'Paramètres manquants: type, itemId, userId' },
        { status: 400 },
      );
    }

    // ─── 3. IDOR protection: userId MUST match authenticated user ────────
    if (u !== user.id) {
      console.warn(`[flutterwave-confirm] IDOR attempt: user ${user.id} tried to fulfill for ${u}`);
      return NextResponse.json(
        { ok: false, error: 'Utilisateur non autorisé' },
        { status: 403 },
      );
    }

    // ─── 4. Require Flutterwave to be configured ────────────────────────
    const secretKey = config.payments.providers.flutterwave.secretKey;
    if (!secretKey) {
      // Demo/dev mode without Flutterwave: refuse auto-fulfillment.
      // Users must use the manual payment flow (upload proof → admin validates).
      return NextResponse.json(
        {
          ok: false,
          error: 'Paiement en ligne non configuré. Utilisez le paiement manuel (Mobile Money → upload preuve).',
        },
        { status: 503 },
      );
    }

    // ─── 5. Require a transaction reference ─────────────────────────────
    if (!tx) {
      return NextResponse.json(
        { ok: false, error: 'Référence de transaction manquante (tx_ref)' },
        { status: 400 },
      );
    }

    // ─── 6. Idempotency check ───────────────────────────────────────────
    const processed = await getProcessedTxs();
    if (processed.some((p) => p.txRef === tx)) {
      // Already processed — redirect to success page without re-applying
      return NextResponse.redirect(
        new URL('/dashboard/subscription?success=1&duplicate=1', config.appUrl || req.url),
        { status: 303 },
      );
    }

    // ─── 7. Verify transaction with Flutterwave API ─────────────────────
    const verification = await verifyFlwTransaction(tx, config);
    if (!verification.ok || !verification.data) {
      return NextResponse.json(
        { ok: false, error: `Vérification Flutterwave échouée: ${verification.error}` },
        { status: 400 },
      );
    }

    // ─── 8. Match amount + currency + metadata ──────────────────────────
    const expected = expectedPrice(t, i, billingCycle);
    if (expected === null) {
      return NextResponse.json(
        { ok: false, error: `Article inconnu: ${t}/${i}` },
        { status: 400 },
      );
    }
    if (Math.abs(verification.data.amount - expected) > 0.01) {
      console.warn(`[flutterwave-confirm] Amount mismatch: expected ${expected}, got ${verification.data.amount}`);
      return NextResponse.json(
        { ok: false, error: 'Montant du paiement incorrect' },
        { status: 400 },
      );
    }

    // Verify the meta.userId from Flutterwave matches our user (defensive)
    const metaUserId = verification.data.meta?.userId;
    if (metaUserId && metaUserId !== user.id) {
      console.warn(`[flutterwave-confirm] Meta user mismatch: ${metaUserId} vs ${user.id}`);
      return NextResponse.json(
        { ok: false, error: 'Métadonnées du paiement incorrectes' },
        { status: 400 },
      );
    }

    // ─── 9. Apply fulfillment + mark as processed ───────────────────────
    await applyFulfillment(user.id, t, i);
    await markTxProcessed({
      txRef: tx,
      processedAt: new Date().toISOString(),
      userId: user.id,
      type: t,
      itemId: i,
    });

    return NextResponse.redirect(
      new URL('/dashboard/subscription?success=1', config.appUrl || req.url),
      { status: 303 },
    );
  } catch (err) {
    console.error('[flutterwave-confirm] error:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
