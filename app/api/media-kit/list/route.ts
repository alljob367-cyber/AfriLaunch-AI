// AfriLaunch AI — List user's media kits
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { kvGet } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const store = await kvGet<{ kits: any[] }>('media-kits');
  const kits = (store?.kits ?? []).filter((k) => k.userId === user.id);

  return NextResponse.json({
    ok: true,
    kits: kits.map((k) => ({
      ...k,
      // Don't send full base64 images in the list — just metadata
      assets: k.assets?.map((a: any) => ({
        ...a,
        dataUrl: a.dataUrl ? '(loaded on demand)' : undefined,
        hasImage: !!a.dataUrl,
      })),
    })),
  });
}
