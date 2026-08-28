// AfriLaunch AI — Get a brand kit (with full images) or delete it
// GET    /api/brand-kit/[id] → full kit with base64 data URLs for done assets
// DELETE /api/brand-kit/[id] → delete the kit

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getBrandKit, deleteBrandKit, getKitProgress } from '@/lib/brand-kit-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  const kit = await getBrandKit(id);
  if (!kit) return NextResponse.json({ error: 'Kit introuvable' }, { status: 404 });
  if (kit.userId !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  return NextResponse.json({
    ok: true,
    kit: {
      ...kit,
      progress: getKitProgress(kit),
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  const ok = await deleteBrandKit(user.id, id);
  if (!ok) return NextResponse.json({ error: 'Kit introuvable' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
