import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

// Z.AI requires: dimensions between 512-2880, multiples of 32, max pixels 2^22 (4194304)
// Valid sizes: 1024x1024, 1344x768, 768x1344, 1152x864, 864x1152, 1440x768
const ASSETS = [
  { name: 'logo', label: 'Logo', size: '1024x1024', prompt: 'Professional rocket logo with purple indigo gradient, flame, stars, modern, clean, vector, high quality' },
  { name: 'logo_dark', label: 'Logo (dark)', size: '1024x1024', prompt: 'Professional rocket logo on dark background, purple indigo gradient, white rocket, modern, vector, high quality' },
  { name: 'banner_facebook', label: 'Bannière Facebook', size: '1440x768', prompt: 'Facebook cover banner for AI tech startup, modern, purple indigo gradient, clean layout, professional, high quality' },
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

  let success = 0;
  for (let i = 0; i < ASSETS.length; i++) {
    const asset = ASSETS[i];
    // Skip already generated files
    const filename = `afrilaunch-${asset.name}.png`;
    const filepath = path.join(outDir, filename);
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
      console.log(`✓ Already exists: ${filename}`);
      success++;
      continue;
    }

    console.log(`Generating: ${asset.label} (${asset.size})...`);
    try {
      const response = await zai.images.generations.create({
        prompt: asset.prompt,
        size: asset.size,
      });
      const base64 = response.data?.[0]?.base64;
      if (!base64) throw new Error('Empty response');

      const buffer = Buffer.from(base64, 'base64');
      fs.writeFileSync(filepath, buffer);
      console.log(`  ✓ Saved: ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);
      success++;
    } catch (err) {
      console.error(`  ✗ Failed: ${asset.name} — ${(err as Error).message.slice(0, 100)}`);
    }

    // Wait 3s between requests to avoid rate limit
    if (i < ASSETS.length - 1) {
      console.log('  (waiting 3s...)');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // Copy SVG logo
  const svgLogo = path.join(process.cwd(), 'public', 'logo.svg');
  if (fs.existsSync(svgLogo)) {
    fs.copyFileSync(svgLogo, path.join(outDir, 'afrilaunch-logo.svg'));
    console.log('\n✓ Copied: afrilaunch-logo.svg');
  }

  // Create ZIP-like README
  const readme = `# AfriLaunch AI — Kit Média Complet

## Contenu du kit

### Logo
- afrilaunch-logo.svg — Logo vectoriel (scalable)
- afrilaunch-logo.png — Logo PNG 1024x1024
- afrilaunch-logo_dark.png — Logo version sombre 1024x1024

### Bannières Réseaux Sociaux
- afrilaunch-banner_facebook.png — Cover Facebook 1440x768
- afrilaunch-banner_instagram.png — Post Instagram 1024x1024
- afrilaunch-banner_linkedin.png — Cover LinkedIn 1440x768
- afrilaunch-banner_youtube.png — Cover YouTube 1440x768

### Favicon
- afrilaunch-favicon.png — 1024x1024

### Créatives Publicitaires
- afrilaunch-ad_facebook.png — Ad Facebook 1440x768
- afrilaunch-ad_instagram.png — Ad Instagram 1024x1024
- afrilaunch-ad_story.png — Ad Story 768x1344

## Couleurs de marque
- Primary: #6366f1 (Indigo)
- Secondary: #8b5cf6 (Violet)
- Accent: #a855f7 (Purple)
- Background: #050508

Généré par AfriLaunch AI — ${new Date().toISOString()}
`;
  fs.writeFileSync(path.join(outDir, 'README.md'), readme);

  console.log(`\n=== TERMINÉ: ${success}/${ASSETS.length} assets générés ===`);
  console.log(`Output: ${outDir}`);
  const files = fs.readdirSync(outDir);
  files.forEach(f => {
    const stat = fs.statSync(path.join(outDir, f));
    console.log(`  ${f} — ${(stat.size / 1024).toFixed(0)} KB`);
  });
}
main().catch(console.error);
