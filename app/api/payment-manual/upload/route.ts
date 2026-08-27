// AfriLaunch AI — Manual payment proof upload API
// POST /api/payment-manual/upload — attach payment proof (image or PDF).
// Body: FormData with `orderId`, `senderName`, `senderPhone`,
//        `transactionReference` (optional), `file` (image/PDF, max 10MB).
// Saves the file to /home/z/my-project/data/payment-proofs/.

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireUser } from '@/lib/auth-helpers';
import { getManualPaymentOrderById, updateManualPaymentOrder } from '@/lib/payment-manual';

const PROOFS_DIR = path.join('/home/z/my-project/data', 'payment-proofs');

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'FormData invalide' }, { status: 400 });
    }

    const orderId = String(formData.get('orderId') ?? '');
    const senderName = String(formData.get('senderName') ?? '').trim();
    const senderPhone = String(formData.get('senderPhone') ?? '').trim();
    const transactionReference = String(formData.get('transactionReference') ?? '').trim();
    const file = formData.get('file') as File | null;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requis' }, { status: 400 });
    }
    if (!senderName) {
      return NextResponse.json({ error: 'Le nom de l\'expéditeur est requis' }, { status: 400 });
    }
    if (!senderPhone) {
      return NextResponse.json({ error: 'Le numéro de téléphone est requis' }, { status: 400 });
    }
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Fichier justificatif manquant' }, { status: 400 });
    }

    // Validate file type
    const mime = file.type || '';
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_MIME.has(mime) && !ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { error: 'Format non supporté. Formats acceptés: JPG, PNG, WebP, PDF.' },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Le fichier dépasse la taille maximale autorisée (10 MB).' },
        { status: 400 },
      );
    }

    // Verify the order belongs to the user
    const order = await getManualPaymentOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }
    if (order.userId !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Impossible de modifier une commande ${order.status}` },
        { status: 400 },
      );
    }

    // Save the file
    await fs.mkdir(PROOFS_DIR, { recursive: true });
    const safeExt = ALLOWED_EXT.has(ext) ? ext : (mime === 'application/pdf' ? 'pdf' : 'jpg');
    const fileName = `${orderId}-${Date.now()}.${safeExt}`;
    const filePath = path.join(PROOFS_DIR, fileName);
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    // Update the order
    const updated = await updateManualPaymentOrder(orderId, {
      proofFileName: fileName,
      proofFileType: mime || `application/${safeExt}`,
      proofFileSize: file.size,
      proofUploadedAt: new Date().toISOString(),
      senderName,
      senderPhone,
      transactionReference: transactionReference || undefined,
    });

    return NextResponse.json({ ok: true, order: updated });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
