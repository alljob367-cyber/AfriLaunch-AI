// AfriLaunch AI — Admin quotas & cost-control stats
// GET /api/admin/quotas — returns cache stats + kit usage + projected costs
//
// Used by /admin/metrics to display real-time cost optimization data:
//   - Image cache hit rate (saves image-gen API calls)
//   - Kits generated this month (across all users)
//   - Projected image-gen cost this month
//   - Quota usage per plan

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/config-store';
import { getCacheStats, getUserBrandKits } from '@/lib/brand-kit-store';
import { getAllUsers } from '@/lib/user-store';
import { getHealthSnapshot } from '@/lib/ai-load-balancer';

async function requireAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Estimated cost per generated image (USD) — adjust if Z.AI pricing changes
const COST_PER_IMAGE_USD = 0.03;
// Average cacheable assets per kit (banners + favicon, excluding logos)
const CACHEABLE_ASSETS_PER_KIT = 5;
const TOTAL_ASSETS_PER_KIT = 7;

export async function GET(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // ── Cache stats ───────────────────────────────────────────────────
  const cacheStats = await getCacheStats();

  // ── Kits this month (across all users) ────────────────────────────
  const users = await getAllUsers();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let kitsThisMonth = 0;
  let totalKits = 0;
  const kitsByPlan: Record<string, number> = { starter: 0, pro: 0, business: 0, enterprise: 0 };

  for (const user of users) {
    const kits = await getUserBrandKits(user.id);
    totalKits += kits.length;
    const thisMonth = kits.filter((k) => k.createdAt >= startOfMonth).length;
    kitsThisMonth += thisMonth;
    if (kitsByPlan[user.plan] !== undefined) kitsByPlan[user.plan] += thisMonth;
  }

  // ── Cost projection ───────────────────────────────────────────────
  // Without cache: kitsThisMonth × TOTAL_ASSETS_PER_KIT × COST_PER_IMAGE
  // With cache (assumed 40% hit rate on cacheable assets):
  //   = kitsThisMonth × (2 logos + 5 × 0.6 cacheable) × COST_PER_IMAGE
  const imagesWithoutCache = kitsThisMonth * TOTAL_ASSETS_PER_KIT;
  const imagesWithCache = kitsThisMonth * (2 + CACHEABLE_ASSETS_PER_KIT * 0.6);
  const estimatedSavings = (imagesWithoutCache - imagesWithCache) * COST_PER_IMAGE_USD;
  const estimatedCostThisMonth = imagesWithCache * COST_PER_IMAGE_USD;
  const estimatedCostWithoutOptim = imagesWithoutCache * COST_PER_IMAGE_USD;

  // ── AI provider health ────────────────────────────────────────────
  const providers = getHealthSnapshot();

  // ── User repartition by plan ──────────────────────────────────────
  const usersByPlan: Record<string, number> = { starter: 0, pro: 0, business: 0, enterprise: 0 };
  for (const u of users) {
    if (usersByPlan[u.plan] !== undefined) usersByPlan[u.plan] += 1;
  }

  return NextResponse.json({
    ok: true,
    cache: {
      entries: cacheStats.entries,
      totalHits: cacheStats.totalHits,
      oldestAgeHours: cacheStats.oldestAge,
      // Hit rate is approximated: totalHits / (totalHits + kitsThisMonth × CACHEABLE_ASSETS_PER_KIT)
      hitRate: cacheStats.totalHits + kitsThisMonth * CACHEABLE_ASSETS_PER_KIT > 0
        ? Math.round((cacheStats.totalHits / (cacheStats.totalHits + kitsThisMonth * CACHEABLE_ASSETS_PER_KIT)) * 100)
        : 0,
    },
    kits: {
      thisMonth: kitsThisMonth,
      total: totalKits,
      byPlan: kitsByPlan,
    },
    costs: {
      costPerImageUsd: COST_PER_IMAGE_USD,
      estimatedThisMonthUsd: Number(estimatedCostThisMonth.toFixed(2)),
      estimatedWithoutOptimizationUsd: Number(estimatedCostWithoutOptim.toFixed(2)),
      estimatedSavingsUsd: Number(estimatedSavings.toFixed(2)),
      savingsPercent: estimatedCostWithoutOptim > 0
        ? Math.round((estimatedSavings / estimatedCostWithoutOptim) * 100)
        : 0,
    },
    users: {
      total: users.length,
      byPlan: usersByPlan,
    },
    providers: providers.map((p) => ({
      name: p.name,
      enabled: p.enabled,
      apiKey: p.apiKey,
      inCooldown: p.inCooldown,
      totalRequests: p.totalRequests,
      totalSuccesses: p.totalSuccesses,
      totalErrors: p.totalErrors,
      successRate: p.successRate,
    })),
  });
}
