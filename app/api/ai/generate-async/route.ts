// AfriLaunch AI — Async AI generation (avoids gateway 502 timeout)
// POST /api/ai/generate-async — starts generation, returns job ID immediately
// GET  /api/ai/generate-async?jobId=xxx — polls for result

import { NextRequest, NextResponse } from 'next/server';
import { runAIForPlan } from '@/lib/ai-runner';
import { requireUser } from '@/lib/auth-helpers';
import { consumeCredits } from '@/lib/user-store';
import type { PlanId } from '@/lib/user-types';

interface GenJob {
  id: string;
  userId: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  type: string;
  result?: { content: string; provider?: string; model?: string; usage?: any };
  error?: string;
  createdAt: number;
  completedAt?: number;
}

const jobs = new Map<string, GenJob>();

// Cleanup old jobs every 5 min
setInterval(() => {
  const tenMinAgo = Date.now() - 10 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (job.createdAt < tenMinAgo) jobs.delete(id);
  }
}, 5 * 60 * 1000);

const CREDIT_COSTS: Record<string, number> = {
  identity: 5, website: 10, content: 1, content_batch: 3,
};

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const creditCost = body.batch ? CREDIT_COSTS.content_batch : (CREDIT_COSTS[body.type] || 1);
  const consumed = await consumeCredits(user.id, creditCost);
  if (!consumed.ok) {
    return NextResponse.json({
      ok: false, error: consumed.error,
      insufficientCredits: !consumed.dailyLimit,
      dailyLimitReached: !!consumed.dailyLimit,
    }, { status: 402 });
  }

  const jobId = 'job_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  jobs.set(jobId, { id: jobId, userId: user.id, status: 'pending', type: body.type, createdAt: Date.now() });

  // Run in background (non-blocking)
  generateInBackground(jobId, body, user.plan, user.id, creditCost);

  return NextResponse.json({
    ok: true, jobId, status: 'pending',
    creditsUsed: creditCost,
    creditsRemaining: consumed.user?.credits,
  });
}

async function generateInBackground(jobId: string, body: any, plan: string, userId: string, creditCost: number) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.status = 'running';

  try {
    let systemPrompt = '';
    let userPrompt = '';

    if (body.type === 'identity') {
      systemPrompt = `Tu es le Branding Agent d'AfriLaunch AI. Tu génères des identités de marque COMPLÈTES au format JSON strict.
Réponse = objet JSON valide (sans markdown, sans backticks):
{"brandName":"string","tagline":"string","description":"string","logo":{"concept":"string","style":"string","colors":["#hex"]},"palette":{"primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","text":"#hex","name":"string"},"typography":{"heading":"string","body":"string","rationale":"string"},"voice":{"tone":"string","personality":["string"],"keywords":["string"]},"socialKit":{"instagram":{"bio":"string","hashtags":["string"]},"twitter":{"bio":"string"},"facebook":{"about":"string"},"linkedin":{"tagline":"string"}},"brandGuidelines":{"do":["string"],"dont":["string"]}}
Réponds UNIQUEMENT avec le JSON.`;
      userPrompt = `Crée une identité pour:\n- Nom: ${body.businessName || '(proposer)'}\n- Industrie: ${body.industry || ''}\n- Pays: ${body.country || 'Afrique'}\n- Style: ${body.style || 'moderne'}`;
    } else if (body.type === 'website') {
      systemPrompt = `Tu es un expert développeur web pour le marché africain. Génère une page HTML moderne, responsive, RICHE EN CONTENU.

RÈGLES:
1. HTML5 complet: <html><head><body></body></html>
2. Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
3. CSS minimal (max 30 lignes)
4. Dark theme + gradients
5. Tout en français
6. JS minimal (smooth scroll + menu mobile)

VISIBILITÉ: opacity:1 partout. PAS de opacity:0, slide-in, fade-in.
Le site doit s'afficher sans JavaScript.

6 SECTIONS MINIMUM:
1. <nav> logo + liens + CTA
2. <section id="hero"> h1 + sous-titre + 2 boutons + stats
3. <section id="services"> 3-6 cartes avec emojis + h3
4. <section id="about"> texte + emoji géant
5. <section id="pricing"> ou témoignages
6. <section id="contact"> formulaire + coordonnées + footer

Réponds UNIQUEMENT avec le HTML. Pas de markdown.`;
      userPrompt = `Crée un site pour:\n- Business: ${body.businessName || 'Mon Business'}\n- Industrie: ${body.industry || 'général'}\n- Couleur: ${body.primaryColor || '#6366f1'}`;
    } else if (body.type === 'content') {
      const formats: Record<string, string> = {
        'instagram-post': 'Post Instagram (caption + emojis + hashtags, max 2200 chars)',
        'instagram-story': 'Story Instagram (texte court + CTA, max 200 chars)',
        'instagram-reel': 'Reel Instagram (script vidéo 30s, max 1500 chars)',
        'tiktok-video': 'Vidéo TikTok (script 15-30s + hashtags, max 1500 chars)',
        'tiktok-caption': 'Caption TikTok (légende + hashtags, max 150 chars)',
        'facebook-post': 'Post Facebook (texte + question + CTA, max 2000 chars)',
        'twitter-thread': 'Thread Twitter/X (5-7 tweets, max 2800 chars)',
        'linkedin-post': 'Post LinkedIn (post pro + CTA, max 3000 chars)',
        'youtube-script': 'Script YouTube (5-10 min, max 5000 chars)',
        'youtube-description': 'Description YouTube (max 5000 chars)',
        'flyer': 'Flyer (headline + offre + CTA, max 800 chars)',
        'newsletter': 'Newsletter (sujet + body + CTA, max 3000 chars)',
        'email-promo': 'Email promo (sujet + body + CTA, max 2000 chars)',
        'blog-post': 'Article de blog (titre + H2/H3 + conclusion, max 8000 chars)',
        'ad-copy': 'Texte publicitaire (headline + body + CTA, max 500 chars)',
        'whatsapp-broadcast': 'Broadcast WhatsApp (message + CTA, max 1000 chars)',
      };
      const fmt = formats[body.format || 'instagram-post'] || formats['instagram-post'];
      systemPrompt = `Tu es le Content Agent d'AfriLaunch AI. Format: ${fmt}. Ton: ${body.tone || 'amical'}. Audience: ${body.audience || 'entrepreneurs africains'}. Emojis + hashtags + CTA. ${body.batch ? 'Génère 3 VARIANTES séparées par ---VARIANTE---' : 'Génère UNE version.'}. Réponds UNIQUEMENT avec le contenu.`;
      userPrompt = `Sujet: ${body.topic || ''}\nBusiness: ${body.businessName || ''}\nIndustrie: ${body.industry || ''}`;
    }

    const result = await runAIForPlan({
      systemPrompt, userMessage: userPrompt,
      maxTokens: body.type === 'website' ? 6000 : 3000,
    }, plan as PlanId);

    if (!result.ok || !result.reply) {
      await consumeCredits(userId, -creditCost);
      job.status = 'failed';
      job.error = result.error || 'Réponse vide';
      job.completedAt = Date.now();
      return;
    }

    job.status = 'done';
    job.result = { content: result.reply, provider: result.provider, model: result.model, usage: result.usage };
    job.completedAt = Date.now();
  } catch (err) {
    await consumeCredits(userId, -creditCost);
    job.status = 'failed';
    job.error = (err as Error).message;
    job.completedAt = Date.now();
  }
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'jobId requis' }, { status: 400 });

  const job = jobs.get(jobId);
  if (!job) return NextResponse.json({ error: 'Job introuvable' }, { status: 404 });
  if (job.userId !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  return NextResponse.json({
    ok: true, jobId: job.id, status: job.status,
    elapsed: Math.round((Date.now() - job.createdAt) / 1000),
    result: job.result, error: job.error,
  });
}
