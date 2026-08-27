// AfriLaunch AI — Generic AI generation endpoint
// POST /api/ai/generate — generates content using the configured LLM provider
// Body: { type: 'identity'|'website'|'content', ...params }

import { NextRequest, NextResponse } from 'next/server';
import { runAI } from '@/lib/ai-runner';
import { requireUser } from '@/lib/auth-helpers';
import { consumeCredits } from '@/lib/user-store';

const CREDIT_COSTS: Record<string, number> = {
  identity: 20,    // branding kit is complex
  website: 30,     // full HTML/CSS generation
  content: 5,      // single piece of content
  content_batch: 25, // batch of multiple formats
};

interface GenerateRequest {
  type: 'identity' | 'website' | 'content';
  // Identity params
  businessName?: string;
  industry?: string;
  country?: string;
  style?: string;
  // Website params
  template?: string;
  primaryColor?: string;
  // Content params
  format?: string; // 'instagram-post' | 'tiktok-reel' | 'flyer' | 'newsletter' | etc.
  topic?: string;
  audience?: string;
  tone?: string;
  batch?: boolean;
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: GenerateRequest;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const creditCost = body.batch ? CREDIT_COSTS.content_batch : (CREDIT_COSTS[body.type] || 5);

  // Consume credits first
  const consumed = await consumeCredits(user.id, creditCost);
  if (!consumed.ok) {
    return NextResponse.json({ ok: false, error: consumed.error, insufficientCredits: true }, { status: 402 });
  }

  let systemPrompt = '';
  let userPrompt = '';

  if (body.type === 'identity') {
    const result = buildIdentityPrompt(body);
    systemPrompt = result.systemPrompt;
    userPrompt = result.userPrompt;
  } else if (body.type === 'website') {
    const result = buildWebsitePrompt(body);
    systemPrompt = result.systemPrompt;
    userPrompt = result.userPrompt;
  } else if (body.type === 'content') {
    const result = buildContentPrompt(body);
    systemPrompt = result.systemPrompt;
    userPrompt = result.userPrompt;
  } else {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
  }

  const result = await runAI({
    systemPrompt,
    userMessage: userPrompt,
    maxTokens: body.type === 'website' ? 4000 : 3000,
  });

  if (!result.ok || !result.reply) {
    // Refund credits on failure
    await consumeCredits(user.id, -creditCost);
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    content: result.reply,
    provider: result.provider,
    model: result.model,
    usage: result.usage,
    creditsUsed: creditCost,
    creditsRemaining: consumed.user?.credits,
  });
}

// ─── Identity prompt builder ──────────────────────────────────────────
function buildIdentityPrompt(body: GenerateRequest) {
  const systemPrompt = `Tu es le Branding Agent d'AfriLaunch AI, expert en création d'identité de marque pour le marché africain.
Tu génères des identités de marque COMPLÈTES et PROFESSIONNELLES au format JSON strict.

Ta réponse DOIT être un objet JSON valide (sans markdown, sans backticks, sans texte avant ou après) avec cette structure exacte:
{
  "brandName": "string - nom de marque proposé",
  "tagline": "string - slogan court mémorable",
  "description": "string - description de la marque en 2-3 phrases",
  "logo": {
    "concept": "string - description visuelle détaillée du logo (forme, symbole, style)",
    "style": "string - style: minimaliste/emblème/typographique/abstrait",
    "colors": ["array of hex color codes used in the logo"]
  },
  "palette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex",
    "name": "string - nom de la palette"
  },
  "typography": {
    "heading": "string - nom de police pour titres (Google Fonts)",
    "body": "string - nom de police pour corps (Google Fonts)",
    "rationale": "string - pourquoi ces polices"
  },
  "voice": {
    "tone": "string - ton de la marque",
    "personality": ["array of personality traits"],
    "keywords": ["array of brand keywords"]
  },
  "socialKit": {
    "instagram": { "bio": "string", "hashtags": ["array"] },
    "twitter": { "bio": "string" },
    "facebook": { "about": "string" },
    "linkedin": { "tagline": "string" }
  },
  "brandGuidelines": {
    "do": ["array of recommendations"],
    "dont": ["array of things to avoid"]
  }
}

Réponds UNIQUEMENT avec le JSON. Pas de texte avant ou après.`;

  const userPrompt = `Crée une identité de marque complète pour:
- Nom du business: ${body.businessName || '(à proposer)'}
- Industrie/Secteur: ${body.industry || '(à déterminer)'}
- Pays/Région: ${body.country || 'Afrique'}
- Style souhaité: ${body.style || 'moderne et professionnel'}

Génère un nom de marque accrocheur si non fourni, adapté au marché africain.`;

  return { systemPrompt, userPrompt };
}

// ─── Website prompt builder ───────────────────────────────────────────
function buildWebsitePrompt(body: GenerateRequest) {
  const template = body.template || 'landing';
  const templates: Record<string, string> = {
    landing: 'landing page marketing avec hero, features, testimonials, pricing, CTA',
    ecommerce: 'boutique e-commerce avec grille produits, panier, checkout',
    restaurant: 'site de restaurant avec menu, galerie, réservation',
    portfolio: 'portfolio avec galerie projets, bio, contact',
    blog: 'blog avec liste articles, catégories, newsletter',
    business: 'site vitrine business avec services, à propos, contact',
  };

  const systemPrompt = `Tu es un expert développeur web qui génère des sites web complets pour le marché africain.
Génère une page HTML unique, moderne et responsive.

RÈGLES:
1. Code HTML5 complet avec <html>, <head>, <body>
2. CSS inline dans <style> (pas de fichiers externes sauf Google Fonts et Tailwind CDN)
3. Utilise Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
4. Design moderne: glassmorphism, gradients, animations CSS, dark theme par défaut
5. Responsive mobile-first
6. Inclus du JavaScript vanilla pour interactions (smooth scroll, menu mobile, etc.)
7. Images: utilise des placeholders avec des emojis ou des gradients colorés
8. Tout le texte en français
9. Sections avec IDs pour navigation ancres
10. Inclus les meta tags SEO (description, og:title, etc.)

Template demandé: ${templates[template] || templates.landing}

Réponds UNIQUEMENT avec le code HTML complet. Pas de markdown, pas de backticks, pas d'explications.`;

  const userPrompt = `Crée un ${templates[template] || templates.landing} pour:
- Business: ${body.businessName || 'Mon Business'}
- Industrie: ${body.industry || 'général'}
- Couleur principale: ${body.primaryColor || '#6366f1 (indigo)'}

Le site doit être professionnel, convertir les visiteurs en clients, et refléter une marque africaine moderne.`;

  return { systemPrompt, userPrompt };
}

// ─── Content prompt builder ───────────────────────────────────────────
function buildContentPrompt(body: GenerateRequest) {
  const formats: Record<string, { name: string; maxChars: number; structure: string }> = {
    'instagram-post': { name: 'Post Instagram', maxChars: 2200, structure: 'caption accrocheuse + emojis + hashtags' },
    'instagram-story': { name: 'Story Instagram', maxChars: 200, structure: 'texte court percutant + CTA' },
    'instagram-reel': { name: 'Reel Instagram', maxChars: 1500, structure: 'script vidéo 30s avec timing + description' },
    'tiktok-video': { name: 'Vidéo TikTok', maxChars: 1500, structure: 'script 15-30s avec hook 3s + description + hashtags' },
    'tiktok-caption': { name: 'Caption TikTok', maxChars: 150, structure: 'légende courte + hashtags viraux' },
    'facebook-post': { name: 'Post Facebook', maxChars: 2000, structure: 'texte engageant + question + CTA' },
    'twitter-thread': { name: 'Thread Twitter/X', maxChars: 2800, structure: '5-7 tweets en thread avec accroche' },
    'linkedin-post': { name: 'Post LinkedIn', maxChars: 3000, structure: 'post professionnel + storytelling + CTA' },
    'youtube-script': { name: 'Script YouTube', maxChars: 5000, structure: 'script complet 5-10 min avec intro/body/outro' },
    'youtube-description': { name: 'Description YouTube', maxChars: 5000, structure: 'description + timestamps + liens + hashtags' },
    'flyer': { name: 'Flyer', maxChars: 800, structure: 'headline + sous-titre + offre + CTA + coordonnées' },
    'newsletter': { name: 'Newsletter', maxChars: 3000, structure: 'sujet + preview + body structuré + CTA' },
    'email-promo': { name: 'Email promo', maxChars: 2000, structure: 'sujet + body + CTA + P.S.' },
    'blog-post': { name: 'Article de blog', maxChars: 8000, structure: 'titre + intro + H2/H3 + conclusion + CTA' },
    'ad-copy': { name: 'Texte publicitaire', maxChars: 500, structure: 'headline + body + CTA (Facebook/Google Ads)' },
    'whatsapp-broadcast': { name: 'Broadcast WhatsApp', maxChars: 1000, structure: 'message + CTA + opt-out' },
  };

  const format = formats[body.format || 'instagram-post'] || formats['instagram-post'];

  const systemPrompt = `Tu es le Content Agent d'AfriLaunch AI, expert en création de contenu pour les réseaux sociaux africains.
Génère du contenu pour le format: ${format.name}

STRUCTURE ATTENDUE: ${format.structure}
LONGUEUR MAX: ${format.maxChars} caractères

RÈGLES:
1. Tout en français (sauf si demande explicite d'anglais)
2. Ton: ${body.tone || 'amical et professionnel'}
3. Audience cible: ${body.audience || 'entrepreneurs africains'}
4. Inclus des emojis pertinents (sans excès)
5. Pour les réseaux: inclus des hashtags pertinents et tendance
6. Call-to-action clair
7. Adapte au marché africain (références culturelles, devises locales si pertinent)

${body.batch ? `Génère 3 VARIANTES différentes du contenu, numérotées 1, 2, 3. Sépare-les par "---VARIANTE---".` : 'Génère UNE seule version du contenu.'}

Réponds UNIQUEMENT avec le contenu. Pas de préfixe, pas d'explications.`;

  const userPrompt = `Sujet/produit: ${body.topic || '(détermine un sujet pertinent)'}
Business: ${body.businessName || 'Mon Business'}
Industrie: ${body.industry || 'général'}`;

  return { systemPrompt, userPrompt };
}
