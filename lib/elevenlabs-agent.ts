// AfriLaunch AI — ElevenLabs Conversational AI agent management
// Creates and manages voice agents that can be connected to WhatsApp via Twilio

import { getConfig } from './config-store';

export interface ElevenLabsAgent {
  agent_id: string;
  name: string;
  voice_id: string;
  conversation_config?: any;
}

// Create a conversational agent on ElevenLabs
export async function createElevenLabsAgent(opts: {
  name: string;
  systemPrompt: string;
  voiceId: string;
  firstMessage: string;
}): Promise<{ ok: boolean; agent?: ElevenLabsAgent; error?: string }> {
  const config = await getConfig();
  if (!config.elevenlabs.apiKey) {
    return { ok: false, error: 'Clé API ElevenLabs non configurée' };
  }

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      method: 'POST',
      headers: {
        'xi-api-key': config.elevenlabs.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: opts.name,
        conversation_config: {
          conversation: {
            text_only: false, // allow voice + text
            max_duration_seconds: 300,
          },
          agent: {
            first_message: opts.firstMessage,
            language: 'fr',
            prompt: {
              prompt: opts.systemPrompt,
            },
            voice: {
              voice_id: opts.voiceId,
            },
          },
          asr: {
            language: 'fr',
          },
          tts: {
            model_id: config.elevenlabs.model,
            voice_id: opts.voiceId,
            stability: config.elevenlabs.stability,
            similarity_boost: config.elevenlabs.similarityBoost,
            style: config.elevenlabs.style,
          },
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      let errMsg = `HTTP ${res.status}`;
      try { const j = JSON.parse(errBody); errMsg = j.detail?.message || j.message || errMsg; } catch { /* */ }
      return { ok: false, error: `ElevenLabs: ${errMsg}` };
    }

    const data = await res.json();
    return {
      ok: true,
      agent: {
        agent_id: data.agent_id,
        name: opts.name,
        voice_id: opts.voiceId,
        conversation_config: data.conversation_config,
      },
    };
  } catch (err) {
    return { ok: false, error: `Erreur réseau: ${(err as Error).message}` };
  }
}

// List all agents
export async function listElevenLabsAgents(): Promise<{ ok: boolean; agents?: ElevenLabsAgent[]; error?: string }> {
  const config = await getConfig();
  if (!config.elevenlabs.apiKey) return { ok: false, error: 'Clé API ElevenLabs non configurée' };

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      headers: { 'xi-api-key': config.elevenlabs.apiKey },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    const data = await res.json();
    return { ok: true, agents: data.agents || [] };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// Delete an agent
export async function deleteElevenLabsAgent(agentId: string): Promise<{ ok: boolean; error?: string }> {
  const config = await getConfig();
  if (!config.elevenlabs.apiKey) return { ok: false, error: 'Clé API non configurée' };

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'DELETE',
      headers: { 'xi-api-key': config.elevenlabs.apiKey },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ─── Twilio WhatsApp message sending ──────────────────────────────────
export async function sendWhatsAppMessage(opts: {
  to: string;
  body: string;
  mediaUrl?: string; // for audio messages
}): Promise<{ ok: boolean; error?: string }> {
  const config = await getConfig();
  const tw = config.twilio;

  if (!tw.enabled || !tw.accountSid || !tw.authToken || !tw.whatsappNumber) {
    return { ok: false, error: 'Twilio non configuré. Admin → WhatsApp Agent.' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${tw.accountSid}/Messages.json`;
  const params = new URLSearchParams({
    From: `whatsapp:${tw.whatsappNumber}`,
    To: opts.to,
    Body: opts.body,
  });
  if (opts.mediaUrl) params.set('MediaUrl', opts.mediaUrl);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${tw.accountSid}:${tw.authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      return { ok: false, error: `Twilio: HTTP ${res.status} ${errBody.slice(0, 200)}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ─── Twilio WhatsApp media sending (images) ───────────────────────────
// Twilio requires a PUBLIC HTTPS URL for MediaUrl — it fetches the image
// from Twilio's servers, not the user's browser. Use our /api/whatsapp-agent/media
// endpoint to serve product images stored as base64 in the whatsapp-agent-store.
export async function sendWhatsAppMedia(opts: {
  to: string;
  mediaUrl: string;  // must be a public HTTPS URL
  caption?: string;  // text caption sent with the image
}): Promise<{ ok: boolean; error?: string }> {
  const config = await getConfig();
  const tw = config.twilio;

  if (!tw.enabled || !tw.accountSid || !tw.authToken || !tw.whatsappNumber) {
    return { ok: false, error: 'Twilio non configuré.' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${tw.accountSid}/Messages.json`;
  const params = new URLSearchParams({
    From: `whatsapp:${tw.whatsappNumber}`,
    To: opts.to,
    MediaUrl: opts.mediaUrl,
  });
  if (opts.caption) params.set('Body', opts.caption);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${tw.accountSid}:${tw.authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      return { ok: false, error: `Twilio media: HTTP ${res.status} ${errBody.slice(0, 200)}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ─── Process incoming WhatsApp message with ElevenLabs agent ──────────
// This uses the ElevenLabs Conversational AI API to get a response from the agent
export async function processWhatsAppWithElevenLabs(userMessage: string, fromNumber: string): Promise<{ ok: boolean; response?: string; error?: string }> {
  const config = await getConfig();

  if (!config.elevenlabs.apiKey) {
    return { ok: false, error: 'ElevenLabs non configuré' };
  }

  // If we have an ElevenLabs agent ID, use the Conversational AI API
  if (config.twilio.elevenLabsAgentId) {
    try {
      // ElevenLabs Conversational AI — send message to agent
      // Use the /v1/convai/twilio/voice endpoint or the conversation API
      // For text-based WhatsApp: we use the agent's LLM directly via conversation

      // First, generate the AI response using the same LLM (OpenRouter) with the agent's prompt
      // This is a simplified approach — in production, you'd use ElevenLabs' WebSocket API for real-time
      const { runAIForPlan } = await import('./ai-runner');
      const result = await runAIForPlan({
        systemPrompt: `Tu es l'assistant IA d'AfriLaunch AI, accessible via WhatsApp par ${fromNumber}.
Tu réponds en français de façon concise et naturelle (max 1000 caractères — limite WhatsApp).
Tu es expert en business africain et aides les entrepreneurs.
Sois chaleureux, professionnel et actionnable.
Si l'utilisateur demande de l'aide spécifique (marketing, branding, etc.), donne des conseils concrets.`,
        userMessage,
        maxTokens: 500,
      }, 'starter');

      if (!result.ok || !result.reply) {
        return { ok: false, error: result.error || 'Pas de réponse' };
      }

      return { ok: true, response: result.reply };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  // No agent configured — use the default AI runner
  const { runAIForPlan } = await import('./ai-runner');
  const result = await runAIForPlan({
    systemPrompt: `Tu es l'assistant WhatsApp d'AfriLaunch AI. Réponds en français, de façon concise (max 1000 caractères). Tu aides les entrepreneurs africains.`,
    userMessage,
    maxTokens: 500,
  }, 'starter');

  if (!result.ok || !result.reply) {
    return { ok: false, error: result.error || 'Pas de réponse' };
  }

  return { ok: true, response: result.reply };
}
