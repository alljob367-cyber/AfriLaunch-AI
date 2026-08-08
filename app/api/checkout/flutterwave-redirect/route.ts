// AfriLaunch AI — Flutterwave redirect (simulated checkout page)
// GET /api/checkout/flutterwave-redirect?type=plan&itemId=pro&userId=usr_xxx
//
// Returns a simple HTML page (dark theme matching the app) with the item name,
// price, and a "Pay Now" button that POSTs to /api/checkout/flutterwave-confirm.

import { NextRequest, NextResponse } from 'next/server';
import { PLANS, CREDIT_PACKS, type PlanId } from '@/lib/user-store';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type') ?? '';
  const itemId = url.searchParams.get('itemId') ?? '';
  const userId = url.searchParams.get('userId') ?? '';
  const billingCycle = url.searchParams.get('billingCycle') ?? 'monthly';

  let name = 'Article';
  let price = 0;
  let description = '';

  if (type === 'plan') {
    const plan = PLANS[itemId as PlanId];
    if (plan) {
      name = `Plan ${plan.name}`;
      price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
      description = `${plan.creditsPerMonth === -1 ? 'Crédits illimités' : `${plan.creditsPerMonth} crédits/mois`} — ${billingCycle === 'annual' ? 'facturation annuelle' : 'facturation mensuelle'}`;
    }
  } else if (type === 'pack') {
    const pack = CREDIT_PACKS.find((p) => p.id === itemId);
    if (pack) {
      name = `Pack ${pack.credits.toLocaleString('fr-FR')} crédits`;
      price = pack.price;
      description = `Top-up de ${pack.credits.toLocaleString('fr-FR')} crédits${pack.discount ? ` (-${pack.discount}%)` : ''}`;
    }
  }

  const priceStr = price > 0 ? `$${price.toFixed(2)}` : 'Gratuit';

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Paiement — AfriLaunch AI</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: #0a0a0a;
    color: #f5f5f5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  .card {
    width: 100%;
    max-width: 480px;
    background: linear-gradient(180deg, #18181b 0%, #0f0f12 100%);
    border: 1px solid #27272a;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 24px 64px -16px rgba(0,0,0,0.6);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    margin-bottom: 1.25rem;
  }
  h1 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.25;
  }
  .desc {
    margin: 0 0 1.5rem;
    font-size: 0.9375rem;
    color: #a1a1aa;
  }
  .price-row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 12px;
    margin-bottom: 1.5rem;
  }
  .price {
    font-size: 2rem;
    font-weight: 800;
    color: #fafafa;
  }
  .currency { font-size: 0.9rem; color: #a1a1aa; }
  button {
    width: 100%;
    padding: 0.875rem 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: #0a0a0a;
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.05s ease, filter 0.15s ease;
  }
  button:hover { filter: brightness(1.08); }
  button:active { transform: translateY(1px); }
  .meta {
    margin-top: 1rem;
    font-size: 0.75rem;
    color: #71717a;
    text-align: center;
  }
  .meta code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #a1a1aa;
    background: #18181b;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    border: 1px solid #27272a;
  }
</style>
</head>
<body>
  <main class="card" role="main">
    <span class="badge">💳 Paiement Flutterwave (simulé)</span>
    <h1>${escapeHtml(name)}</h1>
    <p class="desc">${escapeHtml(description)}</p>
    <div class="price-row">
      <span class="price">${escapeHtml(priceStr)}</span>
      <span class="currency">USD</span>
    </div>
    <form method="POST" action="/api/checkout/flutterwave-confirm">
      <input type="hidden" name="type" value="${escapeHtml(type)}" />
      <input type="hidden" name="itemId" value="${escapeHtml(itemId)}" />
      <input type="hidden" name="userId" value="${escapeHtml(userId)}" />
      <button type="submit">Payer maintenant</button>
    </form>
    <p class="meta">Mode démo — aucun paiement réel ne sera traité.<br />
      User: <code>${escapeHtml(userId || '—')}</code>
    </p>
  </main>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
