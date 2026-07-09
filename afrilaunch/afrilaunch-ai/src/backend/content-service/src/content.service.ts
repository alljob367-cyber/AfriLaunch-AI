// AfriLaunch AI — Content Service
// Génération automatique de tous types de contenus

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { GenerateContentDto } from './dto/generate-content.dto';

@Injectable()
export class ContentService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private config: ConfigService,
  ) {
    this.openai = new OpenAI({ apiKey: this.config.get('OPENAI_API_KEY') });
    this.anthropic = new Anthropic({ apiKey: this.config.get('ANTHROPIC_API_KEY') });
  }

  // ── Dispatch vers le bon générateur ──────────────────────
  async generateContent(organizationId: string, dto: GenerateContentDto) {
    const brand = await this.prisma.brandIdentity.findUnique({
      where: { organizationId },
    });

    const context = {
      brand,
      organizationId,
      language: dto.language ?? 'fr',
      tone: dto.tone ?? 'professional',
      targetAudience: dto.targetAudience,
      topic: dto.topic,
      keywords: dto.keywords,
    };

    let content: any;

    switch (dto.type) {
      case 'FACEBOOK_POST':
        content = await this.generateFacebookPost(context);
        break;
      case 'INSTAGRAM_POST':
        content = await this.generateInstagramPost(context);
        break;
      case 'YOUTUBE_VIDEO':
        content = await this.generateYouTubeScript(context);
        break;
      case 'YOUTUBE_SHORT':
        content = await this.generateYouTubeShort(context);
        break;
      case 'TIKTOK_VIDEO':
        content = await this.generateTikTokScript(context);
        break;
      case 'EMAIL':
        content = await this.generateEmail(context, dto.emailType);
        break;
      case 'BLOG_POST':
        content = await this.generateBlogPost(context);
        break;
      case 'PRODUCT_DESCRIPTION':
        content = await this.generateProductDescription(context);
        break;
      case 'CV':
        content = await this.generateCV(context, dto.cvData);
        break;
      case 'PRESENTATION':
        content = await this.generatePresentation(context);
        break;
      case 'EBOOK':
        content = await this.generateEbookOutline(context);
        break;
      case 'FLYER':
      case 'POSTER':
      case 'BANNER':
      case 'AD_CREATIVE':
        content = await this.generateVisualContent(context, dto.type);
        break;
      default:
        throw new NotFoundException(`Type de contenu '${dto.type}' non supporté`);
    }

    // Sauvegarder en base
    const saved = await this.prisma.content.create({
      data: {
        organizationId,
        type: dto.type,
        title: content.title,
        body: content.body,
        mediaUrls: content.mediaUrls ?? [],
        metadata: content.metadata ?? {},
        status: 'READY',
        generatedBy: 'AI',
        prompt: dto.topic,
        language: dto.language ?? 'fr',
        tags: dto.keywords ?? [],
      },
    });

    return { ...saved, generatedContent: content };
  }

  // ── Facebook Post ──────────────────────────────────────────
  private async generateFacebookPost(ctx: any) {
    const prompt = `Tu es un expert en marketing Facebook pour le marché africain.

Crée UN post Facebook engageant pour la marque "${ctx.brand?.businessName ?? 'Notre marque'}".

Secteur: ${ctx.brand?.industry ?? 'Non spécifié'}
Sujet: ${ctx.topic}
Ton: ${ctx.tone}
Audience: ${ctx.targetAudience ?? 'Entrepreneurs africains'}
Langue: ${ctx.language}

Structure du post :
1. Accroche percutante (1-2 phrases) qui capte l'attention en 3 secondes
2. Corps du message (3-5 paragraphes courts)
3. Call-to-action clair
4. 5-10 hashtags pertinents pour l'Afrique
5. Emoji appropriés

Retourne UNIQUEMENT un JSON :
{
  "title": "titre court du post",
  "body": "texte complet du post avec emojis et hashtags",
  "hook": "première ligne accrocheuse",
  "cta": "call-to-action",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "bestTimeToPost": "Mardi à 19h00",
  "estimatedReach": "Portée estimée: 1000-3000 personnes"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Expert marketing digital Afrique. JSON uniquement.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });

    const parsed = JSON.parse(response.choices[0].message.content!);
    return {
      title: parsed.title,
      body: parsed.body,
      metadata: {
        hook: parsed.hook,
        cta: parsed.cta,
        hashtags: parsed.hashtags,
        bestTimeToPost: parsed.bestTimeToPost,
      },
    };
  }

  // ── Instagram Post ────────────────────────────────────────
  private async generateInstagramPost(ctx: any) {
    const prompt = `Expert Instagram marketing Afrique.

Crée un post Instagram complet pour "${ctx.brand?.businessName}".
Sujet: ${ctx.topic}
Style: ${ctx.tone}

Retourne JSON:
{
  "caption": "légende complète avec emojis",
  "hook": "première ligne",
  "hashtags": ["30 hashtags optimisés"],
  "imagePrompt": "description détaillée pour générer l'image",
  "carouselIdeas": ["idée slide 1", "idée slide 2", "idée slide 3"],
  "storyIdea": "idée pour les Stories",
  "reelIdea": "idée pour Reels"
}`;

    const [textResponse, imageResponse] = await Promise.all([
      this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.9,
      }),
      this.openai.images.generate({
        model: 'dall-e-3',
        prompt: `Instagram post for African business about ${ctx.topic}. 
                 Modern, vibrant, professional. Square format 1:1. 
                 Colors: ${ctx.brand?.primaryColor ?? '#6366F1'}.
                 No text in image.`,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
      }),
    ]);

    const parsed = JSON.parse(textResponse.choices[0].message.content!);
    const imageUrl = await this.storage.uploadFromUrl(
      imageResponse.data[0].url!,
      `content/instagram/${Date.now()}.png`,
      'content-assets',
    );

    return {
      title: `Instagram: ${ctx.topic}`,
      body: parsed.caption,
      mediaUrls: [imageUrl],
      metadata: {
        hashtags: parsed.hashtags,
        carouselIdeas: parsed.carouselIdeas,
        storyIdea: parsed.storyIdea,
        reelIdea: parsed.reelIdea,
      },
    };
  }

  // ── YouTube Script ────────────────────────────────────────
  private async generateYouTubeScript(ctx: any) {
    const prompt = `Tu es un expert YouTubeur africain avec 1M d'abonnés.

Crée un script complet pour une vidéo YouTube de 8-12 minutes.
Sujet: ${ctx.topic}
Marque: ${ctx.brand?.businessName}
Langue: ${ctx.language}

Retourne JSON:
{
  "title": "titre accrocheur avec mot-clé principal",
  "alternativeTitles": ["3 autres titres A/B test"],
  "thumbnail": "description visuelle pour la miniature",
  "duration": "10 minutes",
  "hook": "30 premières secondes accrocheuses",
  "intro": "introduction (1 min)",
  "outline": [
    { "timestamp": "01:00", "section": "nom section", "content": "contenu" }
  ],
  "outro": "conclusion et CTA (1 min)",
  "description": "description YouTube complète avec timestamps et liens",
  "tags": ["50 tags YouTube"],
  "chapters": ["00:00 - Intro", "01:00 - Section 1"],
  "seoKeywords": ["mots-clés principaux"]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 4000,
    });

    const parsed = JSON.parse(response.choices[0].message.content!);
    const fullScript = this.assembleScript(parsed);

    return {
      title: parsed.title,
      body: fullScript,
      metadata: {
        thumbnail: parsed.thumbnail,
        description: parsed.description,
        tags: parsed.tags,
        chapters: parsed.chapters,
        alternativeTitles: parsed.alternativeTitles,
        outline: parsed.outline,
      },
    };
  }

  // ── TikTok Script ─────────────────────────────────────────
  private async generateTikTokScript(ctx: any) {
    const prompt = `Expert TikTok marketing Africa. Viral content creator.

Crée un script TikTok viral de 30-60 secondes.
Sujet: ${ctx.topic}
Marque: ${ctx.brand?.businessName}

Retourne JSON:
{
  "hook": "2 premières secondes ultra-accrocheuses",
  "script": "script complet seconde par seconde",
  "transitions": ["moment 1", "moment 2"],
  "music": "suggestion de son/musique trending",
  "text_overlays": ["texte à afficher à l'écran"],
  "hashtags": ["hashtags TikTok trending Afrique"],
  "voiceover": "texte à dire en voix off",
  "cta": "call to action",
  "thumbnail": "frame à utiliser comme miniature"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.95,
    });

    const parsed = JSON.parse(response.choices[0].message.content!);
    return {
      title: `TikTok: ${ctx.topic}`,
      body: parsed.script,
      metadata: parsed,
    };
  }

  // ── Email ─────────────────────────────────────────────────
  private async generateEmail(ctx: any, emailType?: string) {
    const type = emailType ?? 'newsletter';
    const prompt = `Expert email marketing Afrique.

Type: ${type}
Marque: ${ctx.brand?.businessName}
Sujet: ${ctx.topic}
Audience: ${ctx.targetAudience}
Langue: ${ctx.language}

Retourne JSON:
{
  "subject": "objet de l'email (A/B: 2 variantes)",
  "preheader": "texte d'aperçu",
  "greeting": "formule d'accueil",
  "body": "corps de l'email en HTML responsive",
  "cta": {"text": "texte du bouton", "url": "#"},
  "signature": "signature professionnelle",
  "psTip": "P.S. optionnel"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const parsed = JSON.parse(response.choices[0].message.content!);
    return {
      title: `Email: ${parsed.subject}`,
      body: this.buildEmailHTML(parsed, ctx.brand),
      metadata: parsed,
    };
  }

  // ── Blog Post ─────────────────────────────────────────────
  private async generateBlogPost(ctx: any) {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `Écris un article de blog SEO-optimisé de 1500-2000 mots.

Sujet: ${ctx.topic}
Marque: ${ctx.brand?.businessName}
Mots-clés: ${ctx.keywords?.join(', ')}
Langue: ${ctx.language}
Public: ${ctx.targetAudience}

Structure:
1. Titre H1 accrocheur avec mot-clé principal
2. Introduction engageante (150 mots)
3. 4-6 sections H2 avec contenu détaillé
4. Sous-sections H3 si nécessaire
5. Conclusion avec CTA
6. Meta description 150 caractères

Format: Markdown complet`
      }],
    });

    return {
      title: `Blog: ${ctx.topic}`,
      body: response.content[0].type === 'text' ? response.content[0].text : '',
      metadata: { wordCount: 1500, seoOptimized: true },
    };
  }

  // ── Contenu Visuel ────────────────────────────────────────
  private async generateVisualContent(ctx: any, type: string) {
    const typeMap: Record<string, string> = {
      FLYER: 'promotional flyer',
      POSTER: 'event poster',
      BANNER: 'web banner',
      AD_CREATIVE: 'social media advertisement',
    };

    const imagePrompt = `Professional ${typeMap[type]} for African market.
Brand: ${ctx.brand?.businessName}. Topic: ${ctx.topic}.
Primary color: ${ctx.brand?.primaryColor ?? '#6366F1'}.
Style: Modern, clean, impactful. No Lorem Ipsum.
High quality commercial design.`;

    const response = await this.openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: type === 'BANNER' ? '1792x1024' : '1024x1024',
      quality: 'hd',
    });

    const imageUrl = await this.storage.uploadFromUrl(
      response.data[0].url!,
      `content/${type.toLowerCase()}/${Date.now()}.png`,
      'content-assets',
    );

    return {
      title: `${type}: ${ctx.topic}`,
      body: response.data[0].revised_prompt ?? imagePrompt,
      mediaUrls: [imageUrl],
      metadata: { type, originalPrompt: imagePrompt },
    };
  }

  // ── Helpers ───────────────────────────────────────────────
  private assembleScript(parsed: any): string {
    const sections = parsed.outline?.map((s: any) =>
      `[${s.timestamp}] ${s.section}\n${s.content}`
    ).join('\n\n') ?? '';

    return `🎬 HOOK (0-30s)\n${parsed.hook}\n\n
📖 INTRO (0:30-1:00)\n${parsed.intro}\n\n
📋 CONTENU PRINCIPAL\n${sections}\n\n
🎯 OUTRO\n${parsed.outro}`;
  }

  private buildEmailHTML(parsed: any, brand: any): string {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${parsed.subject}</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
  <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${brand?.primaryColor ?? '#6366F1'}, ${brand?.secondaryColor ?? '#8B5CF6'}); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">${brand?.businessName ?? 'Notre Marque'}</h1>
    </div>
    <div style="padding: 30px;">
      <p style="color: #666;">${parsed.greeting}</p>
      ${parsed.body}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${parsed.cta.url}" style="background: ${brand?.primaryColor ?? '#6366F1'}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          ${parsed.cta.text}
        </a>
      </div>
      ${parsed.psTip ? `<p style="color: #999; font-size: 14px;"><em>P.S. ${parsed.psTip}</em></p>` : ''}
      ${parsed.signature}
    </div>
  </div>
</body></html>`;
  }

  private async generateCV(ctx: any, cvData: any) {
    const prompt = `Crée un CV professionnel moderne pour:
${JSON.stringify(cvData, null, 2)}
Langue: ${ctx.language}
Format: HTML responsive avec design moderne`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    return {
      title: `CV - ${cvData?.name ?? 'Professionnel'}`,
      body: response.choices[0].message.content!,
      metadata: { format: 'HTML', language: ctx.language },
    };
  }

  private async generatePresentation(ctx: any) {
    const prompt = `Crée le contenu d'une présentation de 10 slides sur: ${ctx.topic}
Marque: ${ctx.brand?.businessName}
Format JSON: { "slides": [{ "number": 1, "title": "", "content": "", "speakerNotes": "" }] }`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const parsed = JSON.parse(response.choices[0].message.content!);
    return {
      title: `Présentation: ${ctx.topic}`,
      body: JSON.stringify(parsed.slides),
      metadata: parsed,
    };
  }

  private async generateYouTubeShort(ctx: any) {
    const prompt = `Script YouTube Short 60 secondes max.
Sujet: ${ctx.topic}. Style viral, accrocheur, éducatif.
JSON: { "hook": "", "content": "", "cta": "", "duration": "45s" }`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content!);
    return { title: `Short: ${ctx.topic}`, body: parsed.content, metadata: parsed };
  }

  private async generateEbookOutline(ctx: any) {
    const prompt = `Crée le plan complet d'un ebook de 30 pages sur: ${ctx.topic}
Audience: ${ctx.targetAudience}
JSON: { "title": "", "chapters": [{ "number": 1, "title": "", "sections": [], "pageCount": 3 }] }`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content!);
    return { title: parsed.title, body: JSON.stringify(parsed), metadata: parsed };
  }

  // ── Lister les contenus ───────────────────────────────────
  async getContents(organizationId: string, type?: string, page = 1, limit = 20) {
    const where = { organizationId, ...(type ? { type: type as any } : {}) };
    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.content.count({ where }),
    ]);

    return { contents, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
