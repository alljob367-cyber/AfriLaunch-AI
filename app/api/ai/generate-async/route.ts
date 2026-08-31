// AfriLaunch AI — Async AI generation (avoids gateway 502 timeout)
// POST /api/ai/generate-async — starts generation, returns job ID immediately
// GET  /api/ai/generate-async?jobId=xxx — polls for result

import { NextRequest, NextResponse } from 'next/server';
import { runAIForPlanStream } from '@/lib/ai-runner';
import { requireUser } from '@/lib/auth-helpers';
import { consumeCredits } from '@/lib/user-store';
import { getActionCost, type PlanId } from '@/lib/user-types';
import { kvGet, kvSet } from '@/lib/db';

interface GenJob {
  id: string;
  userId: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  type: string;
  result?: { content: string; provider?: string; model?: string; usage?: any };
  error?: string;
  createdAt: number;
  completedAt?: number;
  // Live progress (updated as chunks stream in) so polling can show
  // "X caractères générés" before the final result is ready.
  partialLength?: number;
  startedAt?: number;
}

// Jobs are persisted in the Supabase kv_store under 'ai-jobs' so they survive
// across serverless invocations (the in-memory Map approach does NOT work on
// Vercel). Jobs auto-expire after 10 minutes — we filter them out on read.
const AI_JOBS_KEY = 'ai-jobs';
const JOB_TTL_MS = 10 * 60 * 1000;

interface AiJobsStore {
  jobs: GenJob[];
}

async function readJobs(): Promise<GenJob[]> {
  const store = await kvGet<AiJobsStore>(AI_JOBS_KEY);
  const all = store?.jobs ?? [];
  // Drop expired jobs on read (replaces the old setInterval cleanup).
  const cutoff = Date.now() - JOB_TTL_MS;
  const active = all.filter((j) => j.createdAt >= cutoff);
  if (active.length !== all.length) {
    await kvSet(AI_JOBS_KEY, { jobs: active });
  }
  return active;
}

async function getJob(jobId: string): Promise<GenJob | null> {
  const jobs = await readJobs();
  return jobs.find((j) => j.id === jobId) ?? null;
}

async function saveJob(job: GenJob): Promise<void> {
  const jobs = await readJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) {
    jobs[idx] = job;
  } else {
    jobs.push(job);
  }
  await kvSet(AI_JOBS_KEY, { jobs });
}

const CREDIT_COSTS: Record<string, number> = {
  identity: getActionCost('identity'),
  website: getActionCost('website'),
  content: getActionCost('content'),
  content_batch: getActionCost('content_batch'),
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
      insufficientCredits: !consumed.dailyLimit && !consumed.paymentRequired,
      dailyLimitReached: !!consumed.dailyLimit,
      paymentRequired: !!consumed.paymentRequired,
    }, { status: 402 });
  }

  const jobId = 'job_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  await saveJob({ id: jobId, userId: user.id, status: 'pending', type: body.type, createdAt: Date.now() });

  // Run in background (non-blocking)
  generateInBackground(jobId, body, user.plan, user.id, creditCost);

  return NextResponse.json({
    ok: true, jobId, status: 'pending',
    creditsUsed: creditCost,
    creditsRemaining: consumed.user?.credits,
  });
}

async function generateInBackground(jobId: string, body: any, plan: string, userId: string, creditCost: number) {
  const job = await getJob(jobId);
  if (!job) return;
  job.status = 'running';
  job.startedAt = Date.now();
  await saveJob(job);

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
      const bizName = body.businessName || 'Mon Business';
      const bizIndustry = body.industry || 'général';
      const bizColor = body.primaryColor || '#6366f1';
      systemPrompt = `Tu es un expert développeur web pour le marché africain. Génère une page HTML COMPLÈTE, MODERNE, RESPONSIVE et TOTALEMENT FONCTIONNELLE.

⚠️ RÈGLES ABSOLUES (non-négociiables):

1. HTML5 COMPLET: <!DOCTYPE html><html lang="fr"><head>...</head><body>...</body></html>
2. Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Dark theme + gradients (${bizColor} comme couleur principale)
4. TOUT le texte en français, contenu RÉEL et PERTINENT pour ${bizName} (${bizIndustry})
5. AUCUNE animation opacity:0, fade-in, slide-in — opacity:1 partout
6. JavaScript FONCTIONNEL inclus dans <script> à la fin du body:

   a) MENU MOBILE: bouton hamburger qui toggle une classe 'hidden' sur le menu nav
   b) SMOOTH SCROLL: tous les liens d'ancrage (#section) défilent en douceur
   c) FORMULAIRE CONTACT: empêche le rechargement, affiche un message de succès,
      et ouvre WhatsApp avec le message pré-rempli:
      window.location.href = 'https://wa.me/NUMERO?text=' + encodeURIComponent(message)
   d) SCROLL REVEAL (optionnel): IntersectionObserver pour révéler les sections
      MAIS avec opacity:1 par défaut (pas de contenu caché si JS désactivé)

7. SEO COMPLET dans <head>:
   - <meta name="description" content="...">
   - <meta property="og:title" content="...">
   - <meta property="og:description" content="...">
   - <meta property="og:type" content="website">
   - <meta name="viewport" content="width=device-width, initial-scale=1.0">
   - <title>${bizName} — ...</title>

8. 8 SECTIONS MINIMUM avec du VRAI CONTENU:
   a) <nav> — Logo texte + liens (Accueil, Services, À propos, Tarifs, Contact) + bouton CTA + hamburger mobile
   b) <section id="hero"> — h1 accrocheur + sous-titre + 2 boutons (Découvrir, Contact) + 3 stats
   c) <section id="services"> — 4-6 cartes avec emoji + h3 + description DÉTAILLÉE
   d) <section id="about"> — Texte sur l'entreprise (min 100 mots) + points forts
   e) <section id="pricing"> — 3 plans tarifaires avec prix en FCFA + features + bouton
   f) <section id="testimonials"> — 3 témoignages clients avec nom + note étoiles
   g) <section id="contact"> — Formulaire (nom, email, téléphone, message) + coordonnées (téléphone, email, adresse) + map embed optionnel
   h) <footer> — Logo + liens + copyright + réseaux sociaux (icônes SVG)

9. STYLES:
   - Background: #0a0a0f ou similaire (dark)
   - Cards: bg-white/5 backdrop-blur rounded-2xl border border-white/10
   - Boutons: gradient ${bizColor} → violet, rounded-xl, hover:scale-105
   - Texte: text-gray-100 (titres), text-gray-400 (corps)
   - Espacement généreux: py-16 md:py-24 par section

10. CONTENT SPECIFIC to ${bizIndustry}:
   - Services adaptés à l'industrie (pas génériques)
   - Prix réalistes en FCFA pour le marché africain
   - Témoignages avec des noms africains (Aïcha, Mamadou, Fatou...)
   - Références culturelles locales si pertinent

Réponds UNIQUEMENT avec le HTML complet. PAS de markdown, PAS de backticks, PAS d'explication.`;
      userPrompt = `Crée un site web complet et fonctionnel pour:
- Business: ${bizName}
- Industrie: ${bizIndustry}
- Couleur principale: ${bizColor}
- Le formulaire de contact doit ouvrir WhatsApp avec un message pré-rempli.
- Inclure 8 sections minimum avec du VRAI contenu adapté au business.`;
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

    // Use the load-balanced streaming runner.
    // - For website (long HTML): maxTokens=4000 (was 6000 — faster, still rich)
    // - For identity (JSON): maxTokens=2000 (was 3000 — JSON is compact)
    // - For content: maxTokens=1500 (was 3000 — most content is short)
    const maxTokens = body.type === 'website' ? 4000 : body.type === 'identity' ? 2000 : 1500;

    let fullContent = '';
    let provider: string | undefined;
    let model: string | undefined;
    let usage: any;
    let lastSaveAt = 0;

    for await (const evt of runAIForPlanStream({
      systemPrompt, userMessage: userPrompt, maxTokens,
    }, plan as PlanId)) {
      if (evt.chunk) {
        fullContent += evt.chunk;
        // Throttle progress saves to once per 800ms (avoid hammering Supabase)
        const now = Date.now();
        if (now - lastSaveAt > 800) {
          lastSaveAt = now;
          const liveJob = await getJob(jobId);
          if (liveJob) {
            liveJob.partialLength = fullContent.length;
            await saveJob(liveJob);
          }
        }
      } else if (evt.usage) {
        usage = evt.usage;
      } else if (evt.done) {
        // Will be saved below
      } else if (evt.error) {
        await consumeCredits(userId, -creditCost);
        const failedJob = await getJob(jobId);
        if (failedJob) {
          failedJob.status = 'failed';
          failedJob.error = evt.error;
          failedJob.completedAt = Date.now();
          await saveJob(failedJob);
        }
        return;
      }
    }

    if (!fullContent) {
      await consumeCredits(userId, -creditCost);
      const failedJob = await getJob(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.error = 'Réponse vide du provider';
        failedJob.completedAt = Date.now();
        await saveJob(failedJob);
      }
      return;
    }

    const doneJob = await getJob(jobId);
    if (!doneJob) return; // job was deleted (expired)
    doneJob.status = 'done';
    doneJob.result = { content: fullContent, provider, model, usage };
    doneJob.partialLength = fullContent.length;
    doneJob.completedAt = Date.now();
    await saveJob(doneJob);
  } catch (err) {
    await consumeCredits(userId, -creditCost);
    const failedJob = await getJob(jobId);
    if (failedJob) {
      failedJob.status = 'failed';
      failedJob.error = (err as Error).message;
      failedJob.completedAt = Date.now();
      await saveJob(failedJob);
    }
  }
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'jobId requis' }, { status: 400 });

  const job = await getJob(jobId);
  if (!job) return NextResponse.json({ error: 'Job introuvable' }, { status: 404 });
  if (job.userId !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

  return NextResponse.json({
    ok: true, jobId: job.id, status: job.status,
    elapsed: Math.round((Date.now() - job.createdAt) / 1000),
    partialLength: job.partialLength ?? 0,
    result: job.result, error: job.error,
  });
}
