import { kvGet } from '../lib/db';

async function main() {
  const brandKits = await kvGet<any>('brand-kits');
  console.log('=== Brand Kits ===');
  console.log('Count:', brandKits?.kits?.length || 0);
  if (brandKits?.kits) {
    for (const kit of brandKits.kits) {
      const done = kit.assets?.filter((a: any) => a.status === 'done').length || 0;
      const total = kit.assets?.length || 0;
      console.log(`  - ${kit.businessName} (${kit.id}) — ${done}/${total} done, has images: ${kit.assets?.some((a:any) => a.dataUrl)}`);
    }
  }

  const mediaKits = await kvGet<any>('media-kits');
  console.log('\n=== Media Kits ===');
  console.log('Count:', mediaKits?.kits?.length || 0);
  if (mediaKits?.kits) {
    for (const kit of mediaKits.kits) {
      const done = kit.assets?.filter((a: any) => a.status === 'done').length || 0;
      const total = kit.assets?.length || 0;
      console.log(`  - ${kit.kitType} ${kit.businessName} (${kit.id}) — ${done}/${total} done`);
    }
  }
}
main().catch(console.error);
