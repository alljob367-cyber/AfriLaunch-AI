// AfriLaunch AI — Identity Service (Création d'identité de marque)
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateBrandDto } from './dto/create-brand.dto';

@Injectable()
export class IdentityService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  // ── Génération complète de l'identité de marque ──────────────
  async generateBrandIdentity(organizationId: string, dto: CreateBrandDto) {
    // Étape 1: Générer le contenu textuel
    const brandContent = await this.generateBrandContent(dto);

    // Étape 2: Générer la palette de couleurs
    const colorPalette = await this.generateColorPalette(dto, brandContent);

    // Étape 3: Générer le logo
    const logoResult = await this.generateLogo(brandContent, colorPalette, dto);

    // Étape 4: Générer la signature email
    const emailSignature = await this.generateEmailSignature(brandContent, colorPalette, logoResult);

    // Étape 5: Sauvegarder en base de données
    const brand = await this.prisma.brandIdentity.upsert({
      where: { organizationId },
      create: {
        organizationId,
        businessName: brandContent.businessName,
        slogan: brandContent.slogan,
        description: brandContent.description,
        logoUrl: logoResult.url,
        logoSvg: logoResult.svg,
        primaryColor: colorPalette.primary,
        secondaryColor: colorPalette.secondary,
        accentColor: colorPalette.accent,
        fontPrimary: colorPalette.fontPrimary,
        fontSecondary: colorPalette.fontSecondary,
        emailSignature,
        brandVoice: brandContent.brandVoice,
        targetAudience: dto.targetAudience,
        industry: dto.industry,
        colorPalettes: {
          create: colorPalette.variations.map((v: any) => ({
            name: v.name,
            colors: v.colors,
            isActive: v.name === 'Primary',
          })),
        },
      },
      update: {
        businessName: brandContent.businessName,
        slogan: brandContent.slogan,
        description: brandContent.description,
        logoUrl: logoResult.url,
        primaryColor: colorPalette.primary,
        secondaryColor: colorPalette.secondary,
        accentColor: colorPalette.accent,
        emailSignature,
        updatedAt: new Date(),
      },
      include: { colorPalettes: true, icons: true },
    });

    return brand;
  }

  // ── Génération de contenu textuel ─────────────────────────────
  private async generateBrandContent(dto: CreateBrandDto) {
    const prompt = `Tu es un expert en branding africain. 
    
Génère l'identité de marque complète pour :
- Type d'entreprise : ${dto.businessType}
- Secteur : ${dto.industry}
- Pays : ${dto.country}
- Description : ${dto.description}
- Audience cible : ${dto.targetAudience}
- Langue : ${dto.language}

Retourne UNIQUEMENT un JSON valide avec :
{
  "businessName": "nom accrocheur et mémorable",
  "slogan": "slogan court et percutant",
  "description": "description professionnelle 2-3 phrases",
  "brandVoice": "professionnel|créatif|dynamique|élégant",
  "keywords": ["mot1", "mot2", "mot3"],
  "values": ["valeur1", "valeur2", "valeur3"],
  "uniqueProposition": "proposition de valeur unique"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert branding avec 20 ans d\'expérience sur le marché africain. Réponds UNIQUEMENT en JSON valide.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    return JSON.parse(response.choices[0].message.content!);
  }

  // ── Génération de palette de couleurs ─────────────────────────
  private async generateColorPalette(dto: CreateBrandDto, brandContent: any) {
    const prompt = `Tu es un designer expert en identité visuelle africaine.
    
Génère une palette de couleurs pour :
- Marque : ${brandContent.businessName}
- Secteur : ${dto.industry}
- Voix de marque : ${brandContent.brandVoice}
- Pays : ${dto.country}

Les couleurs doivent être modernes, professionnelles et adaptées au marché africain.

Retourne UNIQUEMENT un JSON valide :
{
  "primary": "#hexcolor",
  "secondary": "#hexcolor",
  "accent": "#hexcolor",
  "background": "#hexcolor",
  "text": "#hexcolor",
  "fontPrimary": "Inter|Poppins|Montserrat|Raleway",
  "fontSecondary": "Inter|Poppins|Montserrat|Raleway",
  "variations": [
    { "name": "Primary", "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"] },
    { "name": "Dark Mode", "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"] },
    { "name": "Pastel", "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"] }
  ]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Expert designer UI/UX. Réponds UNIQUEMENT en JSON valide.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content!);
  }

  // ── Génération de logo ────────────────────────────────────────
  private async generateLogo(brandContent: any, colorPalette: any, dto: CreateBrandDto) {
    const imagePrompt = `Professional minimalist logo for "${brandContent.businessName}", 
    a ${dto.industry} business in Africa. 
    Style: modern, clean, geometric, scalable vector art.
    Colors: ${colorPalette.primary} primary, ${colorPalette.secondary} secondary.
    White background. No text in logo. Abstract icon only.
    Ultra high quality, professional brand identity.`;

    const imageResponse = await this.openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'natural',
    });

    const imageUrl = imageResponse.data[0].url!;

    // Télécharger et optimiser l'image
    const optimizedUrl = await this.storage.uploadFromUrl(
      imageUrl,
      `logos/${Date.now()}-logo.png`,
      'brand-assets',
    );

    // Générer aussi un SVG de logo (fallback vectoriel)
    const svg = this.generateSvgLogo(brandContent.businessName, colorPalette);

    return { url: optimizedUrl, svg };
  }

  // ── Génération SVG Logo ───────────────────────────────────────
  private generateSvgLogo(name: string, palette: any): string {
    const initials = name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${palette.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${palette.secondary};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="url(#grad)"/>
  <text x="100" y="125" font-family="Inter, sans-serif" font-size="80" font-weight="bold" 
        fill="white" text-anchor="middle" letter-spacing="-2">${initials}</text>
</svg>`;
  }

  // ── Génération Signature Email ────────────────────────────────
  private async generateEmailSignature(brandContent: any, palette: any, logo: any): Promise<string> {
    return `<table style="font-family: '${palette.fontPrimary}', Arial, sans-serif; font-size: 14px; color: #333; border-collapse: collapse; max-width: 500px;">
  <tr>
    <td style="padding: 16px; border-left: 4px solid ${palette.primary}; vertical-align: top;">
      <img src="${logo.url}" alt="${brandContent.businessName} Logo" height="60" style="margin-bottom: 12px; display: block;" />
      <strong style="font-size: 16px; color: ${palette.primary}; display: block; margin-bottom: 4px;">
        [Votre Nom]
      </strong>
      <span style="color: ${palette.secondary}; font-size: 13px; display: block; margin-bottom: 8px;">
        [Votre Poste] · ${brandContent.businessName}
      </span>
      <div style="color: #666; font-size: 12px; line-height: 1.8;">
        📧 contact@${brandContent.businessName.toLowerCase().replace(/\s+/g, '')}.com<br/>
        📱 +XXX XXX XXX XXX<br/>
        🌐 www.${brandContent.businessName.toLowerCase().replace(/\s+/g, '')}.com
      </div>
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;">
        <em style="color: ${palette.accent}; font-size: 12px; font-style: italic;">
          "${brandContent.slogan}"
        </em>
      </div>
    </td>
  </tr>
</table>`;
  }

  // ── Régénérer uniquement le logo ──────────────────────────────
  async regenerateLogo(organizationId: string, style?: string) {
    const brand = await this.prisma.brandIdentity.findUnique({
      where: { organizationId },
    });
    if (!brand) throw new NotFoundException('BRAND_NOT_FOUND');

    const stylePrompt = style ? ` Style: ${style}.` : '';
    const imagePrompt = `Professional logo for "${brand.businessName}".${stylePrompt}
    Primary color: ${brand.primaryColor}. Minimalist, modern, scalable.`;

    const response = await this.openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
    });

    const url = await this.storage.uploadFromUrl(
      response.data[0].url!,
      `logos/${organizationId}-${Date.now()}.png`,
      'brand-assets',
    );

    await this.prisma.brandIdentity.update({
      where: { organizationId },
      data: { logoUrl: url },
    });

    return { logoUrl: url };
  }

  // ── Obtenir l'identité de marque ─────────────────────────────
  async getBrandIdentity(organizationId: string) {
    const brand = await this.prisma.brandIdentity.findUnique({
      where: { organizationId },
      include: { colorPalettes: true, icons: true },
    });
    if (!brand) throw new NotFoundException('BRAND_NOT_FOUND');
    return brand;
  }
}
