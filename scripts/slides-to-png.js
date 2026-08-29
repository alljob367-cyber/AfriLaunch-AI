const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  const slidesDir = '/home/z/my-project/download/slides';
  const outDir = '/home/z/my-project/download/afrilaunch-facebook-ads';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    deviceScaleFactor: 2,
  });

  const slideFiles = ['slide_01.html', 'slide_02.html', 'slide_03.html', 'slide_04.html', 'slide_05.html'];

  for (const file of slideFiles) {
    const filePath = path.join(slidesDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${file} — not found`);
      continue;
    }

    const page = await context.newPage();
    await page.goto('file://' + filePath, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // let fonts + Tailwind load

    const pngName = file.replace('.html', '.png').replace('slide_', 'carrousel-');
    const pngPath = path.join(outDir, pngName);
    await page.screenshot({ path: pngPath, type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1080 } });
    
    const size = fs.statSync(pngPath).size;
    console.log(`✓ ${pngName} (${(size / 1024).toFixed(0)} KB)`);
    await page.close();
  }

  await browser.close();
  console.log('\n=== All slides converted to PNG ===');
  console.log(`Output: ${outDir}`);
}

main().catch(console.error);
