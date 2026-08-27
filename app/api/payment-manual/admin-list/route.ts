// AfriLaunch AI — Manual payment admin list API
// GET /api/payment-manual/admin-list — list ALL payment orders (admin only).
// Query: ?status=, ?country=, ?userId=

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/config-store';
import {
  getManualPaymentOrders,
  getManualPaymentStats,
  type ManualPaymentStatus,
  type PaymentMethod,
} from '@/lib/payment-manual';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

export async function GET(req: NextRequest) {
  try {
    const ok = await requireAdmin(req);
    if (!ok) {
      return NextResponse.json({ error: 'Non authentifié admin' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') as ManualPaymentStatus | null;
    const country = url.searchParams.get('country');
    const userId = url.searchParams.get('userId');
    const method = url.searchParams.get('method') as PaymentMethod | null;

    const filters: Parameters<typeof getManualPaymentOrders>[0] = {};
    if (status) filters.status = status;
    if (country) filters.country = country;
    if (userId) filters.userId = userId;
    if (method) filters.method = method;

    const [orders, stats] = await Promise.all([
      getManualPaymentOrders(filters),
      getManualPaymentStats(),
    ]);

    return NextResponse.json({ ok: true, orders, count: orders.length, stats });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
