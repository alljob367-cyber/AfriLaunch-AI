// AfriLaunch AI — Manual payment list (user) API
// GET /api/payment-manual/list — list the authenticated user's payment orders.
// Query: ?status=pending|approved|rejected|expired

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getManualPaymentOrders, type ManualPaymentStatus } from '@/lib/payment-manual';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') as ManualPaymentStatus | null;

    const orders = await getManualPaymentOrders({
      userId: user.id,
      status: status || undefined,
    });

    return NextResponse.json({ ok: true, orders, count: orders.length });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
