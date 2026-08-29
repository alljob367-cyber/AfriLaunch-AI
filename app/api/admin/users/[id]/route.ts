// AfriLaunch AI — Admin: update a single user (plan, status, credits)
// PATCH /api/admin/users/[id] { plan?, planStatus?, credits?, firstName? }
// DELETE /api/admin/users/[id] (already exists in /api/admin/users route)

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/config-store';
import { updateUser, getUserById, type PlanId } from '@/lib/user-store';
import { PLANS } from '@/lib/user-types';

async function requireAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  // Build allowed updates
  const updates: any = {};

  if (body.plan) {
    const validPlans = Object.keys(PLANS);
    if (!validPlans.includes(body.plan)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }
    updates.plan = body.plan as PlanId;
    // If plan changes, reset credits to the new plan's quota
    const planCredits = PLANS[body.plan as PlanId].creditsPerMonth;
    updates.credits = planCredits === -1 ? 999999 : planCredits;
    updates.creditsUsedThisMonth = 0;
    updates.creditsResetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  if (body.planStatus) {
    const validStatuses = ['active', 'pending_payment', 'canceled', 'past_due', 'trialing'];
    if (!validStatuses.includes(body.planStatus)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }
    updates.planStatus = body.planStatus;

    // If activating (payment confirmed), set credits + dates
    if (body.planStatus === 'active') {
      const user = await getUserById(id);
      if (user) {
        const planCredits = PLANS[user.plan].creditsPerMonth;
        updates.credits = planCredits === -1 ? 999999 : planCredits;
        updates.creditsUsedThisMonth = 0;
        updates.planStartedAt = new Date().toISOString();
        updates.planEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        updates.creditsResetAt = updates.planEndsAt;
      }
    }

    // If setting to pending_payment, zero out credits
    if (body.planStatus === 'pending_payment') {
      updates.credits = 0;
      updates.creditsUsedThisMonth = 0;
    }
  }

  if (body.credits !== undefined) {
    updates.credits = Math.max(0, Number(body.credits) || 0);
  }

  if (body.firstName !== undefined) {
    updates.firstName = String(body.firstName).slice(0, 100);
  }

  const updated = await updateUser(id, updates);
  if (!updated) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  // Strip passwordHash from response
  const { passwordHash: _ph, ...safeUser } = updated as any;
  return NextResponse.json({ ok: true, user: safeUser });
}
