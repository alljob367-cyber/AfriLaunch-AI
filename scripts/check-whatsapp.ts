import { getConfig } from '../lib/config-store';

async function main() {
  const config = await getConfig();
  console.log('=== Twilio Config ===');
  console.log('Enabled:', config.twilio.enabled);
  console.log('Account SID:', config.twilio.accountSid ? '✓ Set' : '✗ Missing');
  console.log('Auth Token:', config.twilio.authToken ? '✓ Set' : '✗ Missing');
  console.log('WhatsApp Number:', config.twilio.whatsappNumber || '✗ Missing');
  console.log('Welcome Message:', config.twilio.welcomeMessage ? '✓ Set' : '✗ Missing');
  console.log('Free For All:', config.twilio.freeForAll);

  console.log('\n=== AI Providers ===');
  console.log('OpenRouter:', config.ai.providers.openrouter?.enabled ? '✓ Enabled' : '✗ Disabled',
    config.ai.providers.openrouter?.apiKey ? '(key set)' : '(no key)');
  console.log('Mistral:', config.ai.providers.mistral?.enabled ? '✓ Enabled' : '✗ Disabled',
    config.ai.providers.mistral?.apiKey ? '(key set)' : '(no key)');
  console.log('Groq:', config.ai.providers.groq?.enabled ? '✓ Enabled' : '✗ Disabled',
    config.ai.providers.groq?.apiKey ? '(key set)' : '(no key)');

  console.log('\n=== Load Balancer Health ===');
  const { getHealthSnapshot } = await import('../lib/ai-load-balancer');
  const { syncHealthFromConfig } = await import('../lib/ai-load-balancer');
  syncHealthFromConfig(config);
  const snapshot = getHealthSnapshot();
  for (const p of snapshot) {
    console.log(`${p.name}: enabled=${p.enabled} apiKey=${p.apiKey} inCooldown=${p.inCooldown} ` +
      `requests=${p.totalRequests} successes=${p.totalSuccesses} errors=${p.totalErrors} ` +
      `successRate=${p.successRate}%`);
  }
}
main().catch(console.error);
