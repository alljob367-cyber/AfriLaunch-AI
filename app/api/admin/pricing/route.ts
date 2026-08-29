// AfriLaunch AI — Admin pricing config API
// GET  /api/admin/pricing — returns current pricing config + quota alert stats
// PUT  /api/admin/pricing { costPerImageUsd } — updates the cost per image
//       (auto-derives the new creditsPerKit value)

import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getConfig } from '@/lib/config-store';
import {
  getPricingConfig, setPricingConfig, deriveCreditsPerKit, getQuotaAlertStats,
} from '@/lib/brand-kit-store';

async function requireAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const config = await getConfig();
  const pricing = await getPricingConfig();
  const quotaStats = await getQuotaAlertStats();

  return NextResponse.json({
    ok: true,
    pricing,
    // Preview of credit cost at different price points (for the admin UI slider)
    tiers: [
      { costPerImageUsd: 0.03, creditsPerKit: deriveCreditsPerKit(0.03), label: 'Free tier / très bon marché' },
      { costPerImageUsd: 0.05, creditsPerKit: deriveCreditsPerKit(0.05), label: 'Bon marché' },
      { costPerImageUsd: 0.10, creditsPerKit: deriveCreditsPerKit(0.10), label: 'Standard' },
      { costPerImageUsd: 0.20, creditsPerKit: deriveCreditsPerKit(0.20), label: 'Premium' },
      { costPerImageUsd: 0.50, creditsPerKit: deriveCreditsPerKit(0.50), label: 'Haut de gamme' },
    ],
    quotaAlerts: quotaStats,
    adminEmail: config.adminEmail || 'admin@afrilaunch.ai',
  });
}

export async function PUT(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { costPerImageUsd?: number };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const cost = Number(body.costPerImageUsd);
  if (isNaN(cost) || cost < 0 || cost > 10) {
    return NextResponse.json({ error: 'costPerImageUsd doit être entre 0 et 10' }, { status: 400 });
  }

  const config = await getConfig();
  const adminEmail = config.adminEmail || 'admin@afrilaunch.ai';
  const updated = await setPricingConfig(cost, adminEmail);

  return NextResponse.json({
    ok: true,
    pricing: updated,
    message: `Pricing mis à jour : ${updated.costPerImageUsd}$/image → ${updated.creditsPerKit} crédits/kit`,
  });
}
