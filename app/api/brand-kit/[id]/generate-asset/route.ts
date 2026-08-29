// AfriLaunch AI — Generate a single brand kit asset (synchronous, no background)
// POST /api/brand-kit/[id]/generate-asset { assetType }
//
// This replaces the fire-and-forget approach that fails on Vercel serverless
// (background promises are killed when the response is sent).
// The client calls this endpoint for each asset sequentially.

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getBrandKit, updateBrandAsset, getCachedImage, setCachedImage, type AssetType } from '@/lib/brand-kit-store';
import { runAIForPlanStream } from '@/lib/ai-runner';
import ZAI from 'z-ai-web-dev-sdk';
import type { PlanId } from '@/lib/user-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s per asset — enough for 1 image

const ASSET_PROMPTS: Record<AssetType, { size: string; build: (ctx: any) => string }> = {
  logo: { size: '1024x1024', build: (c) => `Professional logo for ${c.industry || 'business'}, ${c.style} style, ${c.paletteDesc}, modern, clean, vector, high quality` },
  logo_dark: { size: '1024x1024', build: (c) => `Professional logo for ${c.industry || 'business'} on dark background, ${c.style} style, ${c.paletteDesc}, light version, modern, vector, high quality` },
  banner_facebook: { size: '1440x768', build: (c) => `Facebook cover banner, ${c.industry || 'business'} industry, ${c.style} style, ${c.paletteDesc}, professional marketing banner, clean layout, high quality` },
  banner_instagram: { size: '1024x1024', build: (c) => `Instagram post, ${c.industry || 'business'} industry, ${c.style} style, ${c.paletteDesc}, square format, modern social media design, high quality` },
  banner_linkedin: { size: '1440x768', build: (c) => `LinkedIn cover banner, ${c.industry || 'business'} industry, ${c.style} style, ${c.paletteDesc}, professional corporate banner, clean, high quality` },
  banner_youtube: { size: '1440x768', build: (c) => `YouTube channel banner, ${c.industry || 'business'} industry, ${c.style} style, ${c.paletteDesc}, vibrant banner, modern, high quality` },
  favicon: { size: '1024x1024', build: (c) => `Minimalist favicon icon, ${c.industry || 'business'}, simple geometric shape, ${c.paletteDesc}, flat design, recognizable at small size, high quality` },
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

  // Check if already done
  const existing = kit.assets.find((a) => a.type === assetType);
  if (existing?.status === 'done' && existing.dataUrl) {
    return NextResponse.json({ ok: true, asset: existing, cached: true });
  }

  // Build prompt context
  const palette = kit.identity?.palette || {};
  const paletteDesc = `colors: primary ${palette.primary || '#6366f1'}, secondary ${palette.secondary || '#8b5cf6'}, accent ${palette.accent || '#06b6d4'}`;
  const ctx = { businessName: kit.businessName, industry: kit.industry, style: kit.style, paletteDesc };
  const def = ASSET_PROMPTS[assetType];
  const prompt = def.build(ctx);

  // Mark as generating
  await updateBrandAsset(id, assetType, { status: 'generating', prompt, startedAt: Date.now() });

  // Check cache for non-logo assets
  const cacheable = assetType !== 'logo' && assetType !== 'logo_dark';
  if (cacheable) {
    const cached = await getCachedImage(prompt, def.size);
    if (cached) {
      await updateBrandAsset(id, assetType, { status: 'done', dataUrl: cached, completedAt: Date.now() });
      return NextResponse.json({ ok: true, cached: true, assetType });
    }
  }

  // Generate via Z.AI
  try {
    const zai = await ZAI.create();
    const response = await zai.images.generations.create({
      prompt,
      size: def.size as any,
    });
    const base64 = response.data?.[0]?.base64;
    if (!base64) throw new Error('Réponse image vide');

    const dataUrl = `data:image/png;base64,${base64}`;
    await updateBrandAsset(id, assetType, { status: 'done', dataUrl, completedAt: Date.now() });

    // Save to cache
    if (cacheable) {
      await setCachedImage(prompt, def.size, dataUrl);
    }

    return NextResponse.json({ ok: true, assetType, hasImage: true });
  } catch (err) {
    await updateBrandAsset(id, assetType, { status: 'failed', error: (err as Error).message, completedAt: Date.now() });
    return NextResponse.json({ ok: false, error: (err as Error).message, assetType }, { status: 500 });
  }
}
