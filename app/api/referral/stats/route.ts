// AfriLaunch AI — Referral stats API
// GET /api/referral/stats — return the user's referral stats.

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { requireUser } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const config = await getConfig();
    const r = config.referral;

    return NextResponse.json({
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      referralCreditsEarned: user.referralCreditsEarned,
      referredBy: user.referredBy,
      rewardCreditsReferrer: r.rewardCreditsReferrer,
      rewardCreditsReferee: r.rewardCreditsReferee,
      minPayoutAmount: r.minPayoutAmount,
      enabled: r.enabled,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
