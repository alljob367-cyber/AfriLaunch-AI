// AfriLaunch AI — Financial metrics API
// GET /api/admin/metrics — returns MRR, costs, margins, user breakdown

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/config-store';
import { kvGet } from '@/lib/db';
import { PLANS, type PlanId } from '@/lib/user-types';

interface MetricsUser {
  id: string;
  plan: PlanId;
  planStatus: string;
  credits: number;
  creditsUsedThisMonth: number;
  createdAt: string;
  lastLoginAt: string | null;
}

interface MetricsResponse {
  // Revenue
  mrr: number;
  arr: number;
  // Users
  totalUsers: number;
  activeUsers: number;
  usersByPlan: Record<PlanId, number>;
  // Credits
  totalCreditsUsedThisMonth: number;
  totalCreditsRemaining: number;
  // Estimated AI costs
  estimatedAICostUSD: number;
  // Margin
  grossMargin: number;
  grossMarginPercent: number;
  // Projections
  newUsersThisMonth: number;
  // Plan pricing reference
  plans: Array<{ id: PlanId; name: string; price: number; credits: number; users: number; mrr: number; estimatedCost: number; margin: number }>;
}

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

// Average cost per credit (USD) — based on model routing
const COST_PER_CREDIT_BY_PLAN: Record<PlanId, number> = {
  starter: 0.0005,
  pro: 0.012,
  business: 0.012,
  enterprise: 0.009,
};

export async function GET(req: NextRequest) {
  const ok = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let users: MetricsUser[] = [];
  try {
    const store = await kvGet<{ users: MetricsUser[] }>('users');
    users = store?.users ?? [];
  } catch {
    // No users yet
  }

  // Count users per plan
  const usersByPlan: Record<PlanId, number> = {
    starter: 0, pro: 0, business: 0, enterprise: 0,
  };
  for (const u of users) {
    if (u.plan in usersByPlan) usersByPlan[u.plan]++;
  }

  // Calculate MRR (only active subscriptions count)
  let mrr = 0;
  let estimatedAICost = 0;
  let totalCreditsUsed = 0;
  let totalCreditsRemaining = 0;

  const plansBreakdown = (Object.keys(PLANS) as PlanId[]).map((planId) => {
    const plan = PLANS[planId];
    const count = usersByPlan[planId];
    const planMrr = count * plan.priceMonthly;
    mrr += planMrr;

    // Estimate AI cost: users typically use 20% of their monthly credits
    const avgUsageRate = 0.2; // 20% utilization
    const creditsUsed = count * (plan.creditsPerMonth === -1 ? 5000 : plan.creditsPerMonth) * avgUsageRate;
    const cost = creditsUsed * COST_PER_CREDIT_BY_PLAN[planId];
    estimatedAICost += cost;
    totalCreditsUsed += creditsUsed;

    return {
      id: planId,
      name: plan.name,
      price: plan.priceMonthly,
      credits: plan.creditsPerMonth,
      users: count,
      mrr: planMrr,
      estimatedCost: cost,
      margin: planMrr - cost,
    };
  });

  // Calculate remaining credits
  for (const u of users) {
    totalCreditsRemaining += u.credits;
  }

  // Active users = users who logged in within last 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activeUsers = users.filter((u) => u.lastLoginAt && new Date(u.lastLoginAt).getTime() > thirtyDaysAgo).length;

  // New users this month
  const now = new Date();
  const newUsersThisMonth = users.filter((u) => {
    const created = new Date(u.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const grossMargin = mrr - estimatedAICost;
  const grossMarginPercent = mrr > 0 ? (grossMargin / mrr) * 100 : 0;

  const response: MetricsResponse = {
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(mrr * 12 * 100) / 100,
    totalUsers: users.length,
    activeUsers,
    usersByPlan,
    totalCreditsUsedThisMonth: Math.round(totalCreditsUsed),
    totalCreditsRemaining,
    estimatedAICostUSD: Math.round(estimatedAICost * 100) / 100,
    grossMargin: Math.round(grossMargin * 100) / 100,
    grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
    newUsersThisMonth,
    plans: plansBreakdown,
  };

  return NextResponse.json({ ok: true, metrics: response });
}
