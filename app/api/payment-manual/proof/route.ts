// AfriLaunch AI — Manual payment proof file API
// GET /api/payment-manual/proof?orderId=... — serve the proof file (admin only).
// Admins can view uploaded proofs; users can view their own proofs.

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/config-store';
import { requireUser } from '@/lib/auth-helpers';
import { getManualPaymentOrderById } from '@/lib/payment-manual';
import { getFile } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'orderId requis' }, { status: 400 });
    }

    const order = await getManualPaymentOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }
    if (!order.proofFileName) {
      return NextResponse.json({ error: 'Aucun justificatif attaché' }, { status: 404 });
    }

    // Authorization: admin OR owner
    let authorized = false;
    const adminToken = req.cookies.get('afrilaunch_admin')?.value;
    if (adminToken) {
      authorized = await validateSession(adminToken);
    }
    if (!authorized) {
      const user = await requireUser(req);
      if (user && user.id === order.userId) authorized = true;
    }
    if (!authorized) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const stored = await getFile(order.proofFileName);
    if (!stored) {
      return NextResponse.json({ error: 'Fichier introuvable sur le serveur' }, { status: 404 });
    }
    const buffer = stored.data;
    const mime = stored.mimeType;

    // Wrap the Buffer in a Blob (BodyInit-compatible) for NextResponse.
    // Cast through unknown to bypass the SharedArrayBuffer mismatch in TS lib types.
    const blobPart = buffer as unknown as ArrayBuffer;
    const blob = new Blob([blobPart], { type: mime });
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
