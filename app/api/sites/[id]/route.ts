// AfriLaunch AI — Delete a published site
// DELETE /api/sites/[id]

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { deleteSite } from '@/lib/sites-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

  const ok = await deleteSite(user.id, id);
  if (!ok) return NextResponse.json({ error: 'Site introuvable ou non autorisé' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
