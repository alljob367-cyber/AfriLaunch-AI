// AfriLaunch AI — AI provider health endpoint
// GET  /api/admin/ai-health — get current health snapshot of all AI providers
// POST /api/admin/ai-health — reset health (after fixing a broken key, etc.)

import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getConfig } from '@/lib/config-store';
import { getHealthSnapshot, resetHealth, syncHealthFromConfig } from '@/lib/ai-load-balancer';

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
  syncHealthFromConfig(config);

  const snapshot = getHealthSnapshot();
  const activeCount = snapshot.filter((p) => p.enabled && p.apiKey && !p.inCooldown).length;
  const totalConfigured = snapshot.filter((p) => p.enabled && p.apiKey).length;

  // Compute estimated capacity based on which providers are configured
  // (free-tier rate limits, summed)
  const CAPACITY_PER_PROVIDER: Record<string, number> = {
    openrouter: 1000,    // /day on :free models after $10 deposit
    cerebras: 10000,     // free tier ~10 000 req/day (ultra-fast inference)
    groq: 43200,         // 30 req/min × 60 × 24 (kept for backward compat)
    mistral: 500,        // free tier ~500 req/day
  };
  const estimatedDailyCapacity = snapshot
    .filter((p) => p.enabled && p.apiKey)
    .reduce((sum, p) => sum + (CAPACITY_PER_PROVIDER[p.name] || 0), 0);

  // Estimate how many Starter users can be supported
  // (Starter = 50 messages/day per active user)
  const estimatedStarterUsers = Math.floor(estimatedDailyCapacity / 50);

  return NextResponse.json({
    ok: true,
    providers: snapshot,
    summary: {
      active: activeCount,
      total: totalConfigured,
      cooldown: snapshot.filter((p) => p.inCooldown).length,
    },
    capacity: {
      estimatedDailyRequests: estimatedDailyCapacity,
      estimatedStarterUsers,
      note: estimatedDailyCapacity === 0
        ? 'Aucun provider configuré — configurez au moins OpenRouter dans /admin/ai'
        : activeCount === 0
          ? 'Tous les providers sont en cooldown — réessayez dans 1 minute'
          : `Capacité théorique: ~${estimatedStarterUsers} utilisateurs Starter actifs/jour`,
    },
  });
}

export async function POST(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  resetHealth();
  const config = await getConfig();
  syncHealthFromConfig(config);

  return NextResponse.json({
    ok: true,
    message: 'Health reset. All providers re-initialized from config.',
    providers: getHealthSnapshot(),
  });
}
