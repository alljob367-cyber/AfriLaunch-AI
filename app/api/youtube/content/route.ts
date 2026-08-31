// AfriLaunch AI — YouTube content generation (AI writes title/description/tags)
// POST /api/youtube/content { topic, businessName, industry, tone }
// → { ok, title, description, tags, category, thumbnailPrompt }

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { consumeCredits } from '@/lib/user-store';
import { runAIForPlanStream } from '@/lib/ai-runner';
import { getOrganizationByUserId } from '@/lib/org-store';
import { getActionCost, type PlanId } from '@/lib/user-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CREDIT_COST = getActionCost('youtube_content'); // 3 credits — script + metadata generation

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { topic?: string; businessName?: string; industry?: string; tone?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const topic = (body.topic || '').trim();
  if (!topic) {
    return NextResponse.json({ error: 'Topic requis' }, { status: 400 });
  }

  // Pre-fill from organization
  let businessName = body.businessName || '';
  let industry = body.industry || '';
  if (!businessName || !industry) {
    try {
      const org = await getOrganizationByUserId(user.id);
      if (org) {
        businessName = businessName || org.name;
        industry = industry || org.industry;
      }
    } catch { /* ignore */ }
  }

  // Consume credits
  const consumed = await consumeCredits(user.id, CREDIT_COST);
  if (!consumed.ok) {
    return NextResponse.json({
      ok: false,
      error: consumed.error,
      paymentRequired: !!consumed.paymentRequired,
    }, { status: 402 });
  }

  const systemPrompt = `Tu es le Video Agent d'AfriLaunch AI, expert en création de contenu YouTube pour le marché africain.
Génère le contenu complet pour une vidéo YouTube au format JSON strict.
Réponse = objet JSON valide (sans markdown, sans backticks):
{
  "title": "string — titre accrocheur max 70 caractères, optimisé SEO",
  "description": "string — description complète avec intro, timestamps, liens, hashtags (max 3000 caractères)",
  "tags": ["array of 10-15 tags pertinents"],
  "category": "string — une de: People & Blogs | Education | Comedy | Entertainment | Howto & Style | Science & Technology | Travel & Events | News & Politics | Music | Gaming",
  "thumbnailPrompt": "string — prompt en anglais pour générer une miniature visuelle (décrire la scène, les couleurs, le texte à afficher)"
}
Adapte au marché africain (références culturelles, devise locale si pertinent).
Réponds UNIQUEMENT avec le JSON.`;

  const userPrompt = `Sujet de la vidéo: ${topic}
Business: ${businessName || 'Mon Business'}
Industrie: ${industry || 'général'}
Ton: ${body.tone || 'engageant et professionnel'}`;

  let fullJson = '';
  try {
    for await (const evt of runAIForPlanStream({
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 1500,
    }, user.plan as PlanId)) {
      if (evt.chunk) fullJson += evt.chunk;
      else if (evt.error) throw new Error(evt.error);
    }
    const cleaned = fullJson.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      ok: true,
      ...parsed,
      creditsUsed: CREDIT_COST,
      creditsRemaining: consumed.user?.credits,
    });
  } catch (err) {
    // Refund on failure
    await consumeCredits(user.id, -CREDIT_COST);
    return NextResponse.json({
      ok: false,
      error: `Génération échouée: ${(err as Error).message}`,
      rawReply: fullJson.slice(0, 500),
    }, { status: 500 });
  }
}
