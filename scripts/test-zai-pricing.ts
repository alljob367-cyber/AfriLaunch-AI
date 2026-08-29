import ZAI from 'z-ai-web-dev-sdk';

async function test() {
  try {
    const zai = await ZAI.create();
    const response = await zai.images.generations.create({
      prompt: 'Simple red circle on white background',
      size: '1024x1024',
    });
    console.log('Response keys:', Object.keys(response));
    console.log('Response (truncated):', JSON.stringify(response, (k, v) => {
      if (typeof v === 'string' && v.length > 100) return v.slice(0, 80) + '...[truncated]';
      return v;
    }, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
