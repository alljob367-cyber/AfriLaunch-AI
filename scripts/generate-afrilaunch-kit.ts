// Generate AfriLaunch AI complete media kit and save to /download/
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const ASSETS = [
  { name: 'logo', label: 'Logo', size: '1024x1024', prompt: 'Professional rocket logo with purple indigo gradient, flame, stars, modern, clean, vector style, high quality' },
  { name: 'logo_dark', label: 'Logo (dark bg)', size: '1024x1024', prompt: 'Professional rocket logo on dark background, purple indigo gradient, white rocket, modern, vector, high quality' },
  { name: 'banner_facebook', label: 'Bannière Facebook', size: '1440x768', prompt: 'Facebook cover banner for tech startup, modern, purple indigo gradient, clean layout, professional, high quality' },
  { name: 'banner_instagram', label: 'Post Instagram', size: '1024x1024', prompt: 'Instagram post for AI startup, modern, purple indigo gradient, engaging, square, high quality' },
  { name: 'banner_linkedin', label: 'Bannière LinkedIn', size: '1440x768', prompt: 'LinkedIn cover banner for AI tech company, corporate, purple indigo gradient, professional, clean, high quality' },
  { name: 'banner_youtube', label: 'Bannière YouTube', size: '1440x768', prompt: 'YouTube channel banner for AI tech channel, vibrant, purple indigo gradient, modern, high quality' },
  { name: 'favicon', label: 'Favicon', size: '1024x1024', prompt: 'Minimalist favicon icon, rocket, purple indigo gradient, simple geometric, flat design, high quality' },
  { name: 'ad_facebook', label: 'Pub Facebook', size: '1440x768', prompt: 'Facebook ad creative for AI platform, eye-catching, purple indigo gradient, promotional, modern, high quality' },
  { name: 'ad_instagram', label: 'Pub Instagram', size: '1024x1024', prompt: 'Instagram ad creative for AI startup, vibrant, purple indigo gradient, promotional, square, high quality' },
  { name: 'ad_story', label: 'Pub Story', size: '768x1344', prompt: 'Instagram story ad for AI platform, immersive, purple indigo gradient, vertical, promotional, high quality' },
];

async function main() {
  const outDir = path.join(process.cwd(), 'download', 'afrilaunch-media-kit');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('Initializing ZAI...');
  const zai = await ZAI.create();
  console.log('ZAI ready!\n');

  const results: any[] = [];

  for (const asset of ASSETS) {
    console.log(`Generating: ${asset.label} (${asset.size})...`);
    try {
      const response = await zai.images.generations.create({
        prompt: asset.prompt,
        size: asset.size as any,
      });
      const base64 = response.data?.[0]?.base64;
      if (!base64) throw new Error('Empty response');

      const buffer = Buffer.from(base64, 'base64');
      const filename = `afrilaunch-${asset.name}.png`;
      const filepath = path.join(outDir, filename);
      fs.writeFileSync(filepath, buffer);

      console.log(`  ✓ Saved: ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);
      results.push({ ...asset, filename, size_kb: Math.round(buffer.length / 1024) });
    } catch (err) {
      console.error(`  ✗ Failed: ${asset.name} — ${(err as Error).message}`);
      results.push({ ...asset, error: (err as Error).message });
    }
  }

  // Copy the SVG logo too
  const svgLogo = path.join(process.cwd(), 'public', 'logo.svg');
  if (fs.existsSync(svgLogo)) {
    fs.copyFileSync(svgLogo, path.join(outDir, 'afrilaunch-logo.svg'));
    console.log('\n✓ Copied: afrilaunch-logo.svg');
  }

  // Create a README
  const readme = `# AfriLaunch AI — Kit Média Complet

## Logo
- \`afrilaunch-logo.svg\` — Logo vectoriel SVG ( scalable, fond transparent)
- \`afrilaunch-logo.png\` — Logo PNG 1024x1024 (fond gradient violet)
- \`afrilaunch-logo_dark.png\` — Logo version sombre 1024x1024

## Bannières Réseaux Sociaux
- \`afrilaunch-banner_facebook.png\` — Cover Facebook 1440x768
- \`afrilaunch-banner_instagram.png\` — Post Instagram 1024x1024
- \`afrilaunch-banner_linkedin.png\` — Cover LinkedIn 1440x768
- \`afrilaunch-banner_youtube.png\` — Cover YouTube 1440x768

## Favicon
- \`afrilaunch-favicon.png\` — Favicon 1024x1024

## Créatives Publicitaires
- \`afrilaunch-ad_facebook.png\` — Ad Facebook 1440x768
- \`afrilaunch-ad_instagram.png\` — Ad Instagram 1024x1024
- \`afrilaunch-ad_story.png\` — Ad Story vertical 768x1344

## Couleurs de la marque
- Primary: #6366f1 (Indigo)
- Secondary: #8b5cf6 (Violet)
- Accent: #a855f7 (Purple)
- Background dark: #050508

## Utilisation
Tous les assets sont libres de droits pour AfriLaunch AI.
Utilisez-les sur vos réseaux sociaux, campagnes pub, site web, documents.
`;
  fs.writeFileSync(path.join(outDir, 'README.md'), readme);
  console.log('\n✓ Created: README.md');

  // Summary
  const success = results.filter((r) => !r.error);
  console.log(`\n=== SUMMARY ===`);
  console.log(`Success: ${success.length}/${ASSETS.length}`);
  console.log(`Output: ${outDir}`);
  console.log(`Files:`);
  for (const r of success) {
    console.log(`  - ${r.filename} (${r.size_kb} KB)`);
  }
}

main().catch(console.error);
