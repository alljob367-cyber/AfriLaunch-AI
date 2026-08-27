// AfriLaunch AI — Checkout session API
// POST /api/checkout/session — create a checkout session for a plan or credit pack.
// Uses Stripe if enabled, falls back to a simulated Flutterwave redirect, else errors.

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { PLANS, CREDIT_PACKS, type PlanId } from '@/lib/user-store';
import { requireUser } from '@/lib/auth-helpers';

interface CheckoutBody {
  type: 'plan' | 'pack';
  itemId: string;
  billingCycle?: 'monthly' | 'annual';
}

interface LineItem {
  name: string;
  description: string;
  amount: number; // in USD
}

function resolveItem(body: CheckoutBody): LineItem | null {
  if (body.type === 'plan') {
    const plan = PLANS[body.itemId as PlanId];
    if (!plan) return null;
    const cycle = body.billingCycle === 'annual' ? 'annual' : 'monthly';
    const amount = cycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
    return {
      name: `Plan ${plan.name}`,
      description: `${plan.creditsPerMonth === -1 ? 'Crédits illimités' : `${plan.creditsPerMonth} crédits/mois`} — ${cycle === 'annual' ? 'annuel' : 'mensuel'}`,
      amount,
    };
  }
  if (body.type === 'pack') {
    const pack = CREDIT_PACKS.find((p) => p.id === body.itemId);
    if (!pack) return null;
    return {
      name: `Pack ${pack.credits.toLocaleString('fr-FR')} crédits`,
      description: `Top-up de ${pack.credits.toLocaleString('fr-FR')} crédits${pack.discount ? ` (-${pack.discount}%)` : ''}`,
      amount: pack.price,
    };
  }
  return null;
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

    const { type, itemId, billingCycle } = body as CheckoutBody;
    if (!type || !itemId) {
      return NextResponse.json(
        { error: 'Champs requis manquants: type, itemId' },
        { status: 400 },
      );
    }
    if (type !== 'plan' && type !== 'pack') {
      return NextResponse.json(
        { error: "`type` doit être 'plan' ou 'pack'" },
        { status: 400 },
      );
    }

    const item = resolveItem({ type, itemId, billingCycle });
    if (!item) {
      return NextResponse.json(
        { error: 'Article introuvable: itemId invalide' },
        { status: 404 },
      );
    }

    const config = await getConfig();
    const stripe = config.payments.providers.stripe;
    const flutterwave = config.payments.providers.flutterwave;

    // ─── Stripe path ──────────────────────────────────────────────────
    if (stripe.enabled && stripe.secretKey) {
      try {
        const params = new URLSearchParams();
        params.append('mode', 'payment');
        params.append('success_url', `${config.appUrl}/dashboard/subscription?success=1`);
        params.append('cancel_url', `${config.appUrl}/dashboard/subscription?canceled=1`);
        params.append('client_reference_id', user.id);
        params.append('metadata[type]', type);
        params.append('metadata[itemId]', itemId);
        if (billingCycle) params.append('metadata[billingCycle]', billingCycle);

        // Line items: convert USD amount to cents
        params.append('line_items[0][quantity]', '1');
        params.append('line_items[0][price_data][currency]', (config.payments.currency || 'USD').toLowerCase());
        params.append('line_items[0][price_data][unit_amount]', String(Math.round(item.amount * 100)));
        params.append('line_items[0][price_data][product_data][name]', item.name);
        params.append('line_items[0][price_data][product_data][description]', item.description);

        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripe.secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
          signal: AbortSignal.timeout(20000),
        });

        if (!stripeRes.ok) {
          const errText = await stripeRes.text().catch(() => '');
          let errMsg = `Stripe HTTP ${stripeRes.status}`;
          try {
            const errJson = JSON.parse(errText);
            errMsg = errJson.error?.message || errMsg;
          } catch { /* not JSON */ }
          return NextResponse.json(
            { ok: false, error: `Stripe: ${errMsg}` },
            { status: 502 },
          );
        }

        const session = await stripeRes.json();
        if (!session.url) {
          return NextResponse.json(
            { ok: false, error: 'Stripe: URL de session manquante dans la réponse' },
            { status: 502 },
          );
        }

        return NextResponse.json({ ok: true, url: session.url, provider: 'stripe' });
      } catch (err) {
        return NextResponse.json(
          { ok: false, error: `Stripe: erreur réseau — ${(err as Error).message}` },
          { status: 502 },
        );
      }
    }

    // ─── Flutterwave fallback (simulated) ─────────────────────────────
    if (flutterwave.enabled) {
      const url = `${config.appUrl}/api/checkout/flutterwave-redirect?type=${encodeURIComponent(type)}&itemId=${encodeURIComponent(itemId)}&userId=${encodeURIComponent(user.id)}${billingCycle ? `&billingCycle=${encodeURIComponent(billingCycle)}` : ''}`;
      return NextResponse.json({ ok: true, url, provider: 'flutterwave' });
    }

    // ─── No provider ──────────────────────────────────────────────────
    return NextResponse.json(
      {
        ok: false,
        error: "Aucun provider de paiement configuré. L'admin doit configurer Stripe ou Flutterwave dans /admin/payments",
      },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
