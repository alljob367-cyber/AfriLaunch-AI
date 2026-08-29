// AfriLaunch AI — Generate a single brand kit asset (synchronous)
// POST /api/brand-kit/[id]/generate-asset { assetType }
// Uses Pollinations.ai for image generation (free, no API key, works on Vercel)

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getBrandKit, updateBrandAsset, getCachedImage, setCachedImage, type AssetType } from '@/lib/brand-kit-store';
import { generateImage } from '@/lib/image-gen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ASSET_PROMPTS: Record<AssetType, { width: number; height: number; build: (ctx: any) => string }> = {
  logo: { width: 1024, height: 1024, build: (c) => `Professional logo for ${c.industry || 'business'}, ${c.style} style, ${c.paletteDesc}, modern, clean, vector, high quality` },
  logo_dark: { width: 1024, height: 1024, build: (c) => `Professional logo for ${c.industry || 'business'} on dark background, ${c.style} style, ${c.paletteDesc}, light version, modern, vector, high quality` },
  banner_facebook: { width: 1440, height: 768, build: (c) => `Facebook cover banner, ${c.industry || 'business'} industry, ${c.style} style, ${c.paletteDesc}, professional marketing banner, clean layout, high quality` },
  banner_instagram: { width: 1024, height: 1024, build: (c) => `Instagram post, ${c.industry || 'business'} industry, ${c.style} style, ${c.paletteDesc}, square format, modern social media design, high quality` },
  banner_linkedin: { width: 1440, height: 768, build: (c) => `LinkedIn cover banner, ${c.industry || 'business'} industry, ${c.style} style, ${c.paletteDesc}, professional corporate banner, clean, high quality` },
  banner_youtube: { width: 1440, height: 768, build: (c) => `YouTube channel banner, ${c.industry || 'business'} industry, ${c.style} style, ${c.paletteDesc}, vibrant banner, modern, high quality` },
  favicon: { width: 1024, height: 1024, build: (c) => `Minimalist favicon icon, ${c.industry || 'business'}, simple geometric shape, ${c.paletteDesc}, flat design, recognizable at small size, high quality` },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  const kit = await getBrandKit(id);
  if (!kit) return NextResponse.json({ error: 'Kit introuvable' }, { status: 404 });
  if (kit.userId !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  let body: { assetType?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const assetType = body.assetType as AssetType;
  if (!assetType || !ASSET_PROMPTS[assetType]) {
    return NextResponse.json({ error: 'assetType invalide' }, { status: 400 });
  }

  const existing = kit.assets.find((a) => a.type === assetType);
  if (existing?.status === 'done' && existing.dataUrl) {
    return NextResponse.json({ ok: true, asset: existing, cached: true });
  }

  const palette = kit.identity?.palette || {};
  const paletteDesc = `colors: primary ${palette.primary || '#6366f1'}, secondary ${palette.secondary || '#8b5cf6'}, accent ${palette.accent || '#06b6d4'}`;
  const ctx = { businessName: kit.businessName, industry: kit.industry, style: kit.style, paletteDesc };
  const def = ASSET_PROMPTS[assetType];
  const prompt = def.build(ctx);

  await updateBrandAsset(id, assetType, { status: 'generating', prompt, startedAt: Date.now() });

  const cacheable = assetType !== 'logo' && assetType !== 'logo_dark';
  const cacheKey = `${prompt}::${def.width}x${def.height}`;
  if (cacheable) {
    const cached = await getCachedImage(prompt, `${def.width}x${def.height}`);
    if (cached) {
      await updateBrandAsset(id, assetType, { status: 'done', dataUrl: cached, completedAt: Date.now() });
      return NextResponse.json({ ok: true, cached: true, assetType });
    }
  }

  try {
    const imgResult = await generateImage({
      prompt,
      width: def.width,
      height: def.height,
    });

    if (!imgResult.ok || !imgResult.dataUrl) {
      throw new Error(imgResult.error || 'Échec génération image');
    }

    await updateBrandAsset(id, assetType, { status: 'done', dataUrl: imgResult.dataUrl, completedAt: Date.now() });

    if (cacheable) {
      await setCachedImage(prompt, `${def.width}x${def.height}`, imgResult.dataUrl);
    }

    return NextResponse.json({ ok: true, assetType, hasImage: true });
  } catch (err) {
    await updateBrandAsset(id, assetType, { status: 'failed', error: (err as Error).message, completedAt: Date.now() });
    return NextResponse.json({ ok: false, error: (err as Error).message, assetType }, { status: 500 });
  }
}
