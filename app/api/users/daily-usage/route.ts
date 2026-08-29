// AfriLaunch AI — Daily usage endpoint
// GET /api/users/daily-usage — returns today's usage for the authenticated user
//
// Special case: if the user's planStatus is 'pending_payment' (no active
// subscription), the AI is fully blocked server-side (see consumeCredits in
// lib/user-store). We surface this to the client by returning limit:0 and a
// paymentRequired flag so the UI can show the payment wall consistently.

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getDailyUsage } from '@/lib/user-store';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // Pending-payment users have 0 AI quota — return early with paymentRequired.
  if (user.planStatus === 'pending_payment') {
    return NextResponse.json({
      ok: true,
      limit: 0,
      usedToday: 0,
      remaining: 0,
      paymentRequired: true,
    });
  }

  const usage = await getDailyUsage(user.id);
  return NextResponse.json({ ok: true, ...usage });
}
