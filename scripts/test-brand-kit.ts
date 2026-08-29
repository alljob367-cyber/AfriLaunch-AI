import { createBrandKit, updateBrandAsset, getBrandKit } from '../lib/brand-kit-store';

async function test() {
  // Create a test kit
  const kit = await createBrandKit({
    userId: 'test_user',
    businessName: 'Test Business',
    industry: 'Restaurant',
    country: 'Cameroun',
    style: 'moderne',
    identity: {},
    assets: [
      { type: 'logo', status: 'pending', prompt: '' },
      { type: 'banner_facebook', status: 'pending', prompt: '' },
    ],
  });
  console.log('Kit created:', kit.id);
  
  // Update an asset to 'done' with a fake dataUrl
  await updateBrandAsset(kit.id, 'logo', {
    status: 'done',
    dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
    completedAt: Date.now(),
  });
  
  // Read it back
  const updated = await getBrandKit(kit.id);
  console.log('Kit status:', updated?.status);
  console.log('Assets:', updated?.assets.map(a => ({ type: a.type, status: a.status, hasData: !!a.dataUrl })));
}

test().catch(console.error);
