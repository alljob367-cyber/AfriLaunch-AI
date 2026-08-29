// AfriLaunch AI — Delete a media kit
// DELETE /api/media-kit/[id]

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { kvGet, kvSet } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  const store = await kvGet<{ kits: any[] }>('media-kits');
  if (!store?.kits) return NextResponse.json({ error: 'Kit introuvable' }, { status: 404 });

  const before = store.kits.length;
  store.kits = store.kits.filter((k) => !(k.id === id && k.userId === user.id));
  if (store.kits.length === before) {
    return NextResponse.json({ error: 'Kit introuvable' }, { status: 404 });
  }

  await kvSet('media-kits', store);
  return NextResponse.json({ ok: true });
}
