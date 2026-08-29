// AfriLaunch AI — Generate a single media kit asset (synchronous)
// POST /api/media-kit/[id]/generate-asset { assetType }
// Uses Pollinations.ai for image generation

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { kvGet, kvSet } from '@/lib/db';
import { generateImage } from '@/lib/image-gen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  let body: { assetType?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const store = await kvGet<{ kits: any[] }>('media-kits');
  const kit = store?.kits?.find((k) => k.id === id);
  if (!kit || kit.userId !== user.id) {
    return NextResponse.json({ error: 'Kit introuvable' }, { status: 404 });
  }

  const asset = kit.assets?.find((a: any) => a.type === body.assetType);
  if (!asset) return NextResponse.json({ error: 'Asset introuvable' }, { status: 404 });

  if (asset.status === 'done' && asset.dataUrl) {
    return NextResponse.json({ ok: true, cached: true });
  }

  asset.status = 'generating';
  await kvSet('media-kits', store);

  try {
    // Parse size from asset.size (format "WIDTHxHEIGHT")
    const [w, h] = (asset.size || '1024x1024').split('x').map((n: string) => parseInt(n));
    const imgResult = await generateImage({
      prompt: asset.prompt || `Professional design for ${kit.industry} business, ${kit.style} style, high quality`,
      width: w || 1024,
      height: h || 1024,
    });

    if (!imgResult.ok || !imgResult.dataUrl) {
      throw new Error(imgResult.error || 'Échec génération');
    }

    asset.status = 'done';
    asset.dataUrl = imgResult.dataUrl;

    const allDone = kit.assets.every((a: any) => a.status === 'done' || a.status === 'failed');
    kit.status = allDone ? 'done' : 'running';

    await kvSet('media-kits', store);
    return NextResponse.json({ ok: true, hasImage: true });
  } catch (err) {
    asset.status = 'failed';
    asset.error = (err as Error).message;
    await kvSet('media-kits', store);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
