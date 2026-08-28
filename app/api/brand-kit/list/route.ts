// AfriLaunch AI — List user's brand kits
// GET /api/brand-kit/list → { ok, kits: [...] } (without base64 data URLs — only metadata)

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getUserBrandKits, getKitProgress } from '@/lib/brand-kit-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizeKit(kit: any) {
  return {
    id: kit.id,
    businessName: kit.businessName,
    industry: kit.industry,
    country: kit.country,
    style: kit.style,
    identity: kit.identity,
    status: kit.status,
    progress: getKitProgress(kit),
    assets: kit.assets.map((a: any) => ({
      type: a.type,
      status: a.status,
      hasImage: !!a.dataUrl,
      error: a.error,
    })),
    createdAt: kit.createdAt,
    updatedAt: kit.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const kits = await getUserBrandKits(user.id);
  return NextResponse.json({
    ok: true,
    kits: kits.map(sanitizeKit),
  });
}
