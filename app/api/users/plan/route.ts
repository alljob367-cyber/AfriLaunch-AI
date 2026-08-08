// AfriLaunch AI — User plan API
// GET  /api/users/plan — return the user's current plan + all available plans.
// POST /api/users/plan — change plan { plan: PlanId }. (Called after payment confirmation in prod.)

import { NextRequest, NextResponse } from 'next/server';
import { changeUserPlan, PLANS, sanitizeUser, type PlanId } from '@/lib/user-store';
import { requireUser } from '@/lib/auth-helpers';

const VALID_PLAN_IDS = new Set<PlanId>(['free', 'starter', 'pro', 'business', 'enterprise']);

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    return NextResponse.json({
      plan: user.plan,
      planStatus: user.planStatus,
      planStartedAt: user.planStartedAt,
      planEndsAt: user.planEndsAt,
      plans: PLANS,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
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

    const { plan } = body as { plan?: PlanId };
    if (!plan || !VALID_PLAN_IDS.has(plan as PlanId)) {
      return NextResponse.json(
        { error: 'Plan invalide. Valeurs acceptées: free, starter, pro, business, enterprise' },
        { status: 400 },
      );
    }

    const updated = await changeUserPlan(user.id, plan as PlanId);
    if (!updated) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: sanitizeUser(updated) });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
