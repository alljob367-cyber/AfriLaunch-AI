// AfriLaunch AI — Download kit média (ZIP with brand assets)
// POST /api/download/kit — generates and returns a ZIP file

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';

interface BrandKit {
  brandName: string;
  tagline: string;
  description: string;
  logo: { concept: string; style: string; colors: string[] };
  palette: { primary: string; secondary: string; accent: string; background: string; text: string; name: string };
  typography: { heading: string; body: string; rationale: string };
  voice: { tone: string; personality: string[]; keywords: string[] };
  socialKit: {
    instagram: { bio: string; hashtags: string[] };
    twitter: { bio: string };
    facebook: { about: string };
    linkedin: { tagline: string };
  };
  brandGuidelines: { do: string[]; dont: string[] };
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { kit: BrandKit };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  // Generate individual files as text — we can't use JSZip server-side without installing it,
  // so we return a JSON manifest + individual file downloads.
  // Alternatively, we create a simple .txt/.json bundle.
  // For now, return the kit as a downloadable JSON + a README.

  const manifest = {
    generatedAt: new Date().toISOString(),
    brand: body.kit.brandName,
    files: [
      { name: 'brand-identity.json', content: JSON.stringify(body.kit, null, 2) },
      { name: 'README.txt', content: generateReadme(body.kit) },
      { name: 'logo-concept.txt', content: body.kit.logo.concept },
      { name: 'palette.txt', content: generatePaletteFile(body.kit.palette) },
      { name: 'typography.txt', content: `${body.kit.typography.heading} (titres)\n${body.kit.typography.body} (corps)\n\n${body.kit.typography.rationale}` },
      { name: 'social-bios.txt', content: generateSocialFile(body.kit.socialKit) },
      { name: 'brand-guidelines.txt', content: generateGuidelinesFile(body.kit.brandGuidelines) },
    ],
  };

  // Return the largest file (brand-identity.json) as the download
  // The frontend will trigger individual downloads or show the manifest
  return NextResponse.json({
    ok: true,
    manifest,
    downloadUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(body.kit, null, 2))}`,
    filename: `${body.kit.brandName.toLowerCase().replace(/\s+/g, '-')}-brand-kit.json`,
  });
}

function generateReadme(kit: BrandKit): string {
  return `═══════════════════════════════════════════════════
  KIT MÉDIA — ${kit.brandName.toUpperCase()}
  Généré par AfriLaunch AI
═══════════════════════════════════════════════════

SLOGAN: ${kit.tagline}

DESCRIPTION:
${kit.description}

═══════════════════════════════════════════════════
  FICHIERS INCLUS
═══════════════════════════════════════════════════

1. brand-identity.json    → Identité complète (format JSON)
2. logo-concept.txt       → Description du logo pour votre designer
3. palette.txt            → Codes couleurs (HEX)
4. typography.txt         → Polices Google Fonts recommandées
5. social-bios.txt        → Bios prêtes pour Instagram/Twitter/FB/LinkedIn
6. brand-guidelines.txt   → Recommandations et choses à éviter

═══════════════════════════════════════════════════
  PROCHAINES ÉTAPES
═══════════════════════════════════════════════════

✓ Donnez logo-concept.txt à un graphiste (ou utilisez Canva/Figma)
✓ Appliquez les couleurs dans vos designs (palette.txt)
✓ Importez les polices depuis fonts.google.com
✓ Copiez-collez les bios sur vos réseaux sociaux
✓ Suivez les brand guidelines pour rester cohérent

Généré le ${new Date().toLocaleDateString('fr-FR')} par AfriLaunch AI
`;
}

function generatePaletteFile(palette: BrandKit['palette']): string {
  return `PALETTE DE COULEURS — ${palette.name}
═══════════════════════════════════════════════════

Principale:    ${palette.primary}
Secondaire:    ${palette.secondary}
Accent:        ${palette.accent}
Arrière-plan:  ${palette.background}
Texte:         ${palette.text}

CSS:
:root {
  --color-primary: ${palette.primary};
  --color-secondary: ${palette.secondary};
  --color-accent: ${palette.accent};
  --color-bg: ${palette.background};
  --color-text: ${palette.text};
}
`;
}

function generateSocialFile(social: BrandKit['socialKit']): string {
  return `BIOS RÉSEAUX SOCIAUX
═══════════════════════════════════════════════════

INSTAGRAM (150 caractères max):
${social.instagram.bio}

Hashtags: ${social.instagram.hashtags.join(' ')}

TWITTER/X (160 caractères max):
${social.twitter.bio}

FACEBOOK (155 caractères max):
${social.facebook.about}

LINKEDIN (220 caractères max):
${social.linkedin.tagline}
`;
}

function generateGuidelinesFile(guidelines: BrandKit['brandGuidelines']): string {
  return `BRAND GUIDELINES
═══════════════════════════════════════════════════

À FAIRE:
${guidelines.do.map((d) => `  ✓ ${d}`).join('\n')}

À ÉVITER:
${guidelines.dont.map((d) => `  ✗ ${d}`).join('\n')}
`;
}
