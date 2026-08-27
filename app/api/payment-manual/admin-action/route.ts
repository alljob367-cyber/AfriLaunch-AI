// AfriLaunch AI — Manual payment admin action API
// POST /api/payment-manual/admin-action — approve or reject an order (admin only).
// Body: { orderId: string, action: 'approve'|'reject', note?: string }

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/config-store';
import { approveManualPaymentOrder, rejectManualPaymentOrder } from '@/lib/payment-manual';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

interface ActionBody {
  orderId: string;
  action: 'approve' | 'reject';
  note?: string;
}

// The admin email is not stored on the session currently — we use a stable
// identifier so the order review history is auditable. The session token
// acts as a non-reversible admin identifier.
function adminIdentifier(): string {
  return 'admin@afrilaunch.ai';
}

export async function POST(req: NextRequest) {
  try {
    const ok = await requireAdmin(req);
    if (!ok) {
      return NextResponse.json({ error: 'Non authentifié admin' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    const { orderId, action, note } = body as ActionBody;

    if (!orderId || !action) {
      return NextResponse.json(
        { error: 'Champs requis manquants: orderId, action' },
        { status: 400 },
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: "`action` doit être 'approve' ou 'reject'" },
        { status: 400 },
      );
    }

    const adminEmail = adminIdentifier();

    if (action === 'approve') {
      const result = await approveManualPaymentOrder(orderId, adminEmail);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, order: result.order });
    }

    // reject
    const reason = (note ?? '').trim() || 'Paiement rejeté par l\'administrateur';
    const result = await rejectManualPaymentOrder(orderId, adminEmail, reason);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, order: result.order });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
