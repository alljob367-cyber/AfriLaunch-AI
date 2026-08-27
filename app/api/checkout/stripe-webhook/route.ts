// AfriLaunch AI — Stripe webhook
// POST /api/checkout/stripe-webhook — verifies Stripe signature manually (HMAC SHA256),
// then applies plan changes or credit top-ups for completed checkouts.
//
// The Stripe signature header `stripe-signature` has the format `t=<timestamp>,v1=<hex>`.
// To verify: compute HMAC-SHA256(webhookSecret, `${t}.${rawBody}`) and compare (timing-safe) with `v1`.

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getConfig } from '@/lib/config-store';
import { addCredits, changeUserPlan, CREDIT_PACKS, type PlanId } from '@/lib/user-store';

interface StripeEvent {
  id: string;
  type: string;
  data?: { object?: Record<string, unknown> };
}

interface StripeSessionObject {
  client_reference_id?: string | null;
  metadata?: { type?: string; itemId?: string; billingCycle?: string } | null;
}

function verifyStripeSignature(secret: string, header: string, rawBody: string): boolean {
  // Parse `t=...,v1=...`
  const parts = header.split(',').map((s) => s.trim());
  let t: string | null = null;
  let v1: string | null = null;
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') t = value;
    else if (key === 'v1') v1 = value;
  }
  if (!t || !v1) return false;

  // Optional: reject if timestamp is too old (> 5 minutes) to prevent replay
  const ts = parseInt(t, 10);
  if (!Number.isFinite(ts)) return false;
  const ageMs = Date.now() - ts * 1000;
  if (ageMs > 5 * 60 * 1000 || ageMs < -5 * 60 * 1000) return false;

  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(v1, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
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
    const webhookSecret = config.payments.providers.stripe.webhookSecret;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe webhook secret non configuré' },
        { status: 500 },
      );
    }

    const sigHeader = req.headers.get('stripe-signature');
    if (!sigHeader) {
      return NextResponse.json(
        { error: 'En-tête stripe-signature manquant' },
        { status: 400 },
      );
    }

    // IMPORTANT: read the raw body — signature verification needs the exact bytes.
    const rawBody = await req.text();

    if (!verifyStripeSignature(webhookSecret, sigHeader, rawBody)) {
      return NextResponse.json({ error: 'Signature Stripe invalide' }, { status: 400 });
    }

    let event: StripeEvent;
    try {
      event = JSON.parse(rawBody) as StripeEvent;
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = (event.data?.object ?? {}) as StripeSessionObject;
      const userId = session.client_reference_id ?? '';
      const meta = session.metadata ?? {};
      const { type, itemId } = meta;

      if (userId && type && itemId) {
        await applyFulfillment(userId, type, itemId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
