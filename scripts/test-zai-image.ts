import ZAI from 'z-ai-web-dev-sdk';

async function test() {
  try {
    const zai = await ZAI.create();
    console.log('ZAI initialized OK');
    
    const response = await zai.images.generations.create({
      prompt: 'Simple red circle on white background',
      size: '1024x1024',
    });
    
    console.log('Response keys:', Object.keys(response));
    console.log('Has base64:', !!response.data?.[0]?.base64);
    console.log('Base64 length:', response.data?.[0]?.base64?.length || 0);
    
  } catch (err) {
    console.error('ZAI ERROR:', err);
  }
}
test();
