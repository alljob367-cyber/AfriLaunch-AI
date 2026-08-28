// AfriLaunch AI — Brand Kit generation API
// POST /api/brand-kit/generate { businessName, industry, country, style }
//
// Generates a complete brand kit for the user:
//   1. Textual identity (name, tagline, palette, typography) via AI agent
//   2. Visual assets (logo, logo_dark, banners, favicon) via z-ai-web-dev-sdk
//
// Returns immediately with the kit ID. Generation runs in the background
// (fire-and-forget). The client polls GET /api/brand-kit/[id] for progress.

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { consumeCredits } from '@/lib/user-store';
import { runAIForPlanStream } from '@/lib/ai-runner';
import { createBrandKit, updateBrandKitIdentity, updateBrandAsset, type BrandAsset, type AssetType } from '@/lib/brand-kit-store';
import { getOrganizationByUserId } from '@/lib/org-store';
import type { PlanId } from '@/lib/user-types';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Long-running generation — Vercel Hobby allows up to 60s, Pro 300s
export const maxDuration = 300;

const CREDIT_COST = 15; // brand kit generation costs 15 credits

// All the visual assets we generate for a complete kit
const ASSET_DEFS: Array<{ type: AssetType; size: string; promptBuilder: (ctx: AssetPromptCtx) => string }> = [
  {
    type: 'logo',
    size: '1024x1024',
    promptBuilder: (c) => `Professional logo for "${c.businessName}", ${c.industry} industry, ${c.style} style, ${c.paletteDesc}, modern, clean, scalable, on transparent-like background, vector style, high quality`,
  },
  {
    type: 'logo_dark',
    size: '1024x1024',
    promptBuilder: (c) => `Professional logo for "${c.businessName}" on dark background, ${c.industry}, ${c.style} style, ${c.paletteDesc}, light version for dark themes, modern, vector style, high quality`,
  },
  {
    type: 'banner_facebook',
    size: '1440x720',
    promptBuilder: (c) => `Facebook cover banner for "${c.businessName}", ${c.industry}, ${c.style} style, ${c.paletteDesc}, professional marketing banner with brand identity, clean layout, space for text, high quality`,
  },
  {
    type: 'banner_instagram',
    size: '1024x1024',
    promptBuilder: (c) => `Instagram profile post for "${c.businessName}", ${c.industry}, ${c.style} style, ${c.paletteDesc}, square format, eye-catching, modern social media design, high quality`,
  },
  {
    type: 'banner_linkedin',
    size: '1440x720',
    promptBuilder: (c) => `LinkedIn cover banner for "${c.businessName}", ${c.industry}, ${c.style} style, ${c.paletteDesc}, professional corporate banner, business aesthetic, clean, high quality`,
  },
  {
    type: 'banner_youtube',
    size: '1440x720',
    promptBuilder: (c) => `YouTube channel banner for "${c.businessName}", ${c.industry}, ${c.style} style, ${c.paletteDesc}, vibrant banner with safe area for channel avatar, modern, high quality`,
  },
  {
    type: 'favicon',
    size: '1024x1024',
    promptBuilder: (c) => `Minimalist favicon icon for "${c.businessName}", ${c.industry}, simple geometric shape, ${c.paletteDesc}, recognizable at small size, flat design, high quality`,
  },
];

interface AssetPromptCtx {
  businessName: string;
  industry: string;
  style: string;
  paletteDesc: string;
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { businessName?: string; industry?: string; country?: string; style?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  // Pre-fill from organization if missing
  let businessName = (body.businessName || '').trim();
  let industry = (body.industry || '').trim();
  let country = (body.country || '').trim();
  if (!businessName || !industry) {
    try {
      const org = await getOrganizationByUserId(user.id);
      if (org) {
        businessName = businessName || org.name;
        industry = industry || org.industry;
        country = country || org.country;
      }
    } catch { /* ignore */ }
  }

  if (!businessName) {
    return NextResponse.json({ error: 'Nom du business requis (configurer votre organisation ou fournir businessName)' }, { status: 400 });
  }

  const style = body.style || 'moderne et professionnel';

  // Consume credits
  const consumed = await consumeCredits(user.id, CREDIT_COST);
  if (!consumed.ok) {
    return NextResponse.json({
      ok: false,
      error: consumed.error,
      paymentRequired: !!consumed.paymentRequired,
      insufficientCredits: !consumed.paymentRequired && !consumed.dailyLimit,
    }, { status: 402 });
  }

  // Create the kit with all assets pending
  const assets: BrandAsset[] = ASSET_DEFS.map((def) => ({
    type: def.type,
    status: 'pending',
    prompt: '', // will be filled after identity is generated
  }));

  const kit = await createBrandKit({
    userId: user.id,
    businessName,
    industry,
    country: country || 'Afrique',
    style,
    identity: {},
    assets,
  });

  // Fire-and-forget generation in the background
  generateInBackground(kit.id, user.id, user.plan as PlanId, businessName, industry, country || 'Afrique', style)
    .catch((err) => console.error('Brand kit generation failed:', err));

  return NextResponse.json({
    ok: true,
    kitId: kit.id,
    creditsUsed: CREDIT_COST,
    creditsRemaining: consumed.user?.credits,
    message: 'Génération du kit de marque démarrée. Suivez la progression dans le dashboard.',
  });
}

async function generateInBackground(
  kitId: string,
  userId: string,
  plan: PlanId,
  businessName: string,
  industry: string,
  country: string,
  style: string,
) {
  // ── Step 1: Generate textual brand identity via AI agent ──────────
  const systemPrompt = `Tu es le Branding Agent d'AfriLaunch AI. Tu génères des identités de marque COMPLÈTES au format JSON strict.
Réponse = objet JSON valide (sans markdown, sans backticks):
{"brandName":"string","tagline":"string","description":"string","palette":{"primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","text":"#hex"},"typography":{"heading":"string Google Font","body":"string Google Font"},"voice":{"tone":"string"},"socialKit":{"instagram":{"bio":"string max 150 chars","hashtags":["array of 5-10"]},"twitter":{"bio":"string max 160 chars"}}}
Réponds UNIQUEMENT avec le JSON.`;
  const userPrompt = `Crée une identité pour:
- Nom du business: ${businessName}
- Industrie/Secteur: ${industry || 'général'}
- Pays/Région: ${country}
- Style souhaité: ${style}`;

  let identity: any = {};
  try {
    let fullJson = '';
    for await (const evt of runAIForPlanStream({
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 1500,
    }, plan)) {
      if (evt.chunk) fullJson += evt.chunk;
      else if (evt.error) throw new Error(evt.error);
    }
    // Strip markdown fences if any
    const cleaned = fullJson.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    identity = JSON.parse(cleaned);
    await updateBrandKitIdentity(kitId, identity);
  } catch (err) {
    console.error('Identity generation failed:', err);
    // Continue with empty identity — visual assets can still be generated
  }

  // Build palette description for image prompts
  const palette = identity.palette || {};
  const paletteDesc = `colors: primary ${palette.primary || '#6366f1'}, secondary ${palette.secondary || '#8b5cf6'}, accent ${palette.accent || '#06b6d4'}`;

  const ctx: AssetPromptCtx = { businessName, industry, style, paletteDesc };

  // ── Step 2: Generate each visual asset ────────────────────────────
  let zai: any;
  try {
    zai = await ZAI.create();
  } catch (err) {
    console.error('ZAI init failed:', err);
    // Mark all assets as failed
    for (const def of ASSET_DEFS) {
      await updateBrandAsset(kitId, def.type, { status: 'failed', error: 'Image generation SDK indisponible' });
    }
    return;
  }

  for (const def of ASSET_DEFS) {
    const prompt = def.promptBuilder(ctx);
    // Mark as generating
    await updateBrandAsset(kitId, def.type, { status: 'generating', prompt, startedAt: Date.now() });

    try {
      const response = await zai.images.generations.create({
        prompt,
        size: def.size,
      });
      const base64 = response.data?.[0]?.base64;
      if (!base64) throw new Error('Réponse image vide');
      const dataUrl = `data:image/png;base64,${base64}`;
      await updateBrandAsset(kitId, def.type, {
        status: 'done',
        dataUrl,
        completedAt: Date.now(),
      });
    } catch (err) {
      await updateBrandAsset(kitId, def.type, {
        status: 'failed',
        error: (err as Error).message,
        completedAt: Date.now(),
      });
    }
  }
}
