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

// ─── Sync user's WhatsApp agent config to ElevenLabs ──────────────────
// Creates or updates an ElevenLabs Conversational AI agent from the user's
// WhatsAppAgentConfig. The agent on ElevenLabs stores the system prompt,
// first message, and voice settings. This is mainly for voice conversations
// (if the user later wants to use ElevenLabs' real-time voice via WebSocket).
// For text WhatsApp, we still use our AI runner with the same system prompt.
export async function syncAgentToElevenLabs(opts: {
  agentName: string;
  systemPrompt: string;
  firstMessage: string;
  voiceId?: string;
}): Promise<{ ok: boolean; agentId?: string; error?: string }> {
  const config = await getConfig();
  if (!config.elevenlabs.apiKey) {
    return { ok: false, error: 'ElevenLabs non configuré. Admin → AI → ElevenLabs.' };
  }

  const voiceId = opts.voiceId || config.elevenlabs.voiceId || '21m00Tcm4TlvDq8ikWAM';

  try {
    // If we already have an agent ID, update it
    if (config.twilio.elevenLabsAgentId) {
      const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${config.twilio.elevenLabsAgentId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': config.elevenlabs.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: opts.agentName,
          conversation_config: {
            agent: {
              first_message: opts.firstMessage,
              language: 'fr',
              prompt: { prompt: opts.systemPrompt },
              voice: { voice_id: voiceId },
            },
            tts: {
              model_id: config.elevenlabs.model,
              voice_id: voiceId,
              stability: config.elevenlabs.stability,
              similarity_boost: config.elevenlabs.similarityBoost,
              style: config.elevenlabs.style,
            },
          },
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        return { ok: false, error: `ElevenLabs update: HTTP ${res.status} ${errBody.slice(0, 200)}` };
      }
      return { ok: true, agentId: config.twilio.elevenLabsAgentId };
    }

    // Create new agent
    const result = await createElevenLabsAgent({
      name: opts.agentName,
      systemPrompt: opts.systemPrompt,
      voiceId,
      firstMessage: opts.firstMessage,
    });
    if (!result.ok || !result.agent) {
      return { ok: false, error: result.error || 'Création échouée' };
    }
    return { ok: true, agentId: result.agent.agent_id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ─── STT: Transcribe WhatsApp voice message ───────────────────────────
// When a user sends a voice note on WhatsApp, Twilio sends a MediaUrl
// pointing to the audio file. We download it, send it to ElevenLabs STT,
// and return the transcribed text.
export async function transcribeWhatsAppAudio(audioUrl: string): Promise<{ ok: boolean; text?: string; error?: string }> {
  const config = await getConfig();
  if (!config.elevenlabs.apiKey) {
    return { ok: false, error: 'ElevenLabs non configuré pour STT' };
  }

  try {
    // 1. Download the audio file from Twilio's MediaUrl
    const audioRes = await fetch(audioUrl, { signal: AbortSignal.timeout(15000) });
    if (!audioRes.ok) {
      return { ok: false, error: `Téléchargement audio échoué: HTTP ${audioRes.status}` };
    }
    const audioBuffer = await audioRes.arrayBuffer();

    // 2. Send to ElevenLabs Scribe STT endpoint
    // POST /v1/speech-to-text with multipart/form-data
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'whatsapp_voice.ogg');
    formData.append('model_id', 'scribe_v1');
    formData.append('language', 'fr');

    const sttRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': config.elevenlabs.apiKey,
      },
      body: formData,
      signal: AbortSignal.timeout(30000),
    });

    if (!sttRes.ok) {
      const errBody = await sttRes.text().catch(() => '');
      return { ok: false, error: `ElevenLabs STT: HTTP ${sttRes.status} ${errBody.slice(0, 200)}` };
    }

    const data = await sttRes.json();
    const text = data.text?.trim();
    if (!text) {
      return { ok: false, error: 'Transcription vide' };
    }
    return { ok: true, text };
  } catch (err) {
    return { ok: false, error: `STT erreur: ${(err as Error).message}` };
  }
}

// ─── TTS: Generate voice response for WhatsApp ────────────────────────
// Converts the agent's text response to an audio file (MP3) that can be
// sent via Twilio WhatsApp MediaUrl. Returns a data URL (base64 audio/mpeg).
// The webhook can then serve this via /api/whatsapp-agent/media to give
// Twilio a public URL to fetch.
export async function generateVoiceResponse(text: string): Promise<{ ok: boolean; audioDataUrl?: string; error?: string }> {
  const config = await getConfig();
  if (!config.elevenlabs.apiKey) {
    return { ok: false, error: 'ElevenLabs non configuré pour TTS' };
  }

  const voiceId = config.elevenlabs.voiceId || '21m00Tcm4TlvDq8ikWAM';

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': config.elevenlabs.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.slice(0, 500), // TTS limit
        model_id: config.elevenlabs.model,
        voice_settings: {
          stability: config.elevenlabs.stability,
          similarity_boost: config.elevenlabs.similarityBoost,
          style: config.elevenlabs.style,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      return { ok: false, error: `ElevenLabs TTS: HTTP ${res.status} ${errBody.slice(0, 200)}` };
    }

    const audioBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString('base64');
    const dataUrl = `data:audio/mpeg;base64,${base64}`;

    return { ok: true, audioDataUrl: dataUrl };
  } catch (err) {
    return { ok: false, error: `TTS erreur: ${(err as Error).message}` };
  }
}
