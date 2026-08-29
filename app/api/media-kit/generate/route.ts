import { generateImage } from '@/lib/image-gen';
// AfriLaunch AI — Media Kit generation API
// POST /api/media-kit/generate { type: 'social' | 'ads', businessName, industry, style, platform }
//
// Generates a complete media kit with AI-designed visuals:
//   - Social kit: profile pic, cover Facebook, story Instagram, post template, banner LinkedIn
//   - Ads kit: ad creative Facebook, ad creative Instagram, display banner, story ad, Google ad banner
//
// Uses z-ai-web-dev-sdk for image generation + AI for copy (headlines, CTAs).

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { consumeCredits } from '@/lib/user-store';
import { runAIForPlanStream } from '@/lib/ai-runner';
import { getOrganizationByUserId } from '@/lib/org-store';
import { kvGet, kvSet } from '@/lib/db';
import type { PlanId } from '@/lib/user-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CREDIT_COST = 25; // media kit = more images than brand kit

interface MediaAsset {
  id: string;
  type: string;
  label: string;
  size: string;
  status: 'pending' | 'generating' | 'done' | 'failed';
  prompt: string;
  dataUrl?: string;
  error?: string;
}

interface MediaKit {
  id: string;
  userId: string;
  kitType: 'social' | 'ads';
  businessName: string;
  industry: string;
  style: string;
  // AI-generated copy
  copy?: {
    headlines: string[];
    taglines: string[];
    ctas: string[];
    adCopy?: string;
  };
  assets: MediaAsset[];
  status: string;
  createdAt: number;
}

const SOCIAL_ASSETS: Array<{ type: string; label: string; size: string; promptTpl: string }> = [
  { type: 'profile_pic', label: 'Photo de profil', size: '1024x1024', promptTpl: 'Professional profile picture logo for {industry} business, {style} style, clean, modern, high quality' },
  { type: 'cover_facebook', label: 'Cover Facebook', size: '1440x768', promptTpl: 'Facebook cover banner for {industry} business, {style} style, professional, clean layout, high quality' },
  { type: 'story_instagram', label: 'Story Instagram', size: '768x1344', promptTpl: 'Instagram story template for {industry} business, {style} style, vertical, engaging, high quality' },
  { type: 'post_template', label: 'Template post', size: '1024x1024', promptTpl: 'Instagram post template for {industry} business, {style} style, square, modern design, space for text, high quality' },
  { type: 'banner_linkedin', label: 'Bannière LinkedIn', size: '1440x768', promptTpl: 'LinkedIn banner for {industry} business, {style} style, corporate, professional, high quality' },
];

const ADS_ASSETS: Array<{ type: string; label: string; size: string; promptTpl: string }> = [
  { type: 'ad_facebook', label: 'Créative pub Facebook', size: '1440x768', promptTpl: 'Facebook ad creative for {industry} business, {style} style, eye-catching, promotional, high quality' },
  { type: 'ad_instagram', label: 'Créative pub Instagram', size: '1024x1024', promptTpl: 'Instagram ad creative for {industry} business, {style} style, square, vibrant, promotional, high quality' },
  { type: 'ad_story', label: 'Pub Story (vertical)', size: '768x1344', promptTpl: 'Instagram story ad for {industry} business, {style} style, vertical, immersive, promotional, high quality' },
  { type: 'ad_display', label: 'Bannière display', size: '1344x768', promptTpl: 'Display ad banner for {industry} business, {style} style, landscape, clean, promotional, high quality' },
  { type: 'ad_google', label: 'Bannière Google Ads', size: '1440x768', promptTpl: 'Google display ad banner for {industry} business, {style} style, professional, clean, high quality' },
];

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { type?: string; businessName?: string; industry?: string; style?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const kitType = body.type === 'ads' ? 'ads' : 'social';

  // Pre-fill from organization
  let businessName = (body.businessName || '').trim();
  let industry = (body.industry || '').trim();
  if (!businessName || !industry) {
    try {
      const org = await getOrganizationByUserId(user.id);
      if (org) {
        businessName = businessName || org.name;
        industry = industry || org.industry;
      }
    } catch { /* ignore */ }
  }
  if (!businessName) {
    return NextResponse.json({ error: 'Nom du business requis' }, { status: 400 });
  }

  const style = body.style || 'moderne et professionnel';

  // Consume credits
  const consumed = await consumeCredits(user.id, CREDIT_COST);
  if (!consumed.ok) {
    return NextResponse.json({
      ok: false,
      error: consumed.error,
      paymentRequired: !!consumed.paymentRequired,
    }, { status: 402 });
  }

  // Create kit
  const assetDefs = kitType === 'ads' ? ADS_ASSETS : SOCIAL_ASSETS;
  const assets: MediaAsset[] = assetDefs.map((def) => ({
    id: 'ma_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: def.type,
    label: def.label,
    size: def.size as any,
    status: 'pending',
    prompt: '',
  }));

  const kit: MediaKit = {
    id: 'mk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    userId: user.id,
    kitType,
    businessName,
    industry,
    style,
    assets,
    status: 'pending',
    createdAt: Date.now(),
  };

  // Save kit
  const store = await kvGet<{ kits: MediaKit[] }>('media-kits');
  const s = store ?? { kits: [] };
  s.kits.unshift(kit);
  if (s.kits.length > 200) s.kits = s.kits.slice(0, 200);
  await kvSet('media-kits', s);

  // Fire-and-forget generation
  generateInBackground(kit.id, user.plan as PlanId, businessName, industry, style, kitType, assetDefs)
    .catch((err) => console.error('Media kit generation failed:', err));

  return NextResponse.json({
    ok: true,
    kitId: kit.id,
    creditsUsed: CREDIT_COST,
    creditsRemaining: consumed.user?.credits,
    message: `Kit média ${kitType === 'ads' ? 'publicitaire' : 'réseaux sociaux'} démarré. Suivez la progression ci-dessous.`,
  });
}

async function generateInBackground(
  kitId: string,
  plan: PlanId,
  businessName: string,
  industry: string,
  style: string,
  kitType: string,
  assetDefs: Array<{ type: string; label: string; size: string; promptTpl: string }>,
) {
  // Step 1: Generate copy (headlines, taglines, CTAs)
  try {
    const systemPrompt = `Tu es un expert en marketing digital pour le marché africain.
Génère du contenu marketing au format JSON strict:
{"headlines":["5 headlines accrocheurs max 60 caractères"],"taglines":["3 taglines max 80 caractères"],"ctas":["3 call-to-action max 20 caractères"]${kitType === 'ads' ? ',"adCopy":"texte publicitaire complet max 300 caractères avec hook + bénéfices + CTA"' : ''}}
Adapte au business: ${businessName}, industrie: ${industry}.
Réponds UNIQUEMENT avec le JSON.`;

    let fullJson = '';
    for await (const evt of runAIForPlanStream({
      systemPrompt,
      userMessage: `Crée du contenu marketing pour ${businessName} (${industry}). Style: ${style}.`,
      maxTokens: 1000,
    }, plan)) {
      if (evt.chunk) fullJson += evt.chunk;
      else if (evt.error) throw new Error(evt.error);
    }
    const cleaned = fullJson.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    const copy = JSON.parse(cleaned);

    // Update kit with copy
    const store = await kvGet<{ kits: MediaKit[] }>('media-kits');
    if (store) {
      const kit = store.kits.find((k) => k.id === kitId);
      if (kit) {
        kit.copy = copy;
        kit.status = 'running';
        await kvSet('media-kits', store);
      }
    }
  } catch (err) {
    console.error('Copy generation failed:', err);
  }

  // Step 2: Generate images (client-driven via generate-asset endpoint)
  // This background function only generates the AI copy. Images are generated
  // by the client calling /api/media-kit/[id]/generate-asset for each asset.
  // No Z.AI needed here — just mark assets as pending.
  return;
}
