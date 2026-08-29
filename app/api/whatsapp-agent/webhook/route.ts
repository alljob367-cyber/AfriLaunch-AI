// AfriLaunch AI — Twilio WhatsApp webhook
// POST /api/whatsapp-agent/webhook — receives WhatsApp messages from Twilio
// Forwards to AI, sends response back via Twilio
//
// Per-user routing: looks up the AfriLaunch user who connected this WhatsApp
// number (in social-store). If found, uses THEIR agent config (custom prompt,
// business context, FAQ, tone, business hours). If not found, falls back to
// admin defaults.

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { sendWhatsAppMessage, sendWhatsAppMedia, transcribeWhatsAppAudio, generateVoiceResponse } from '@/lib/elevenlabs-agent';
import { kvGet, kvSet } from '@/lib/db';
import {
  getConfigByWhatsAppNumber,
  buildSystemPrompt,
  isWithinBusinessHours,
  type CatalogProduct,
} from '@/lib/whatsapp-agent-store';
import { runAIForPlanFast, runAIForPlanFastStream } from '@/lib/ai-runner';
import { syncHealthFromConfig, pickProviderChain, markError, markSuccess, classifyError, type ProviderName } from '@/lib/ai-load-balancer';

interface WhatsAppUser {
  phoneNumber: string;
  name: string;
  firstMessageAt: string;
  lastMessageAt: string;
  messageCount: number;
  // Track which AfriLaunch user (if any) owns this WhatsApp number
  linkedUserId?: string;
}

async function readWhatsAppUsers(): Promise<WhatsAppUser[]> {
  const users = await kvGet<WhatsAppUser[]>('whatsapp-users');
  return users ?? [];
}

async function writeWhatsAppUsers(users: WhatsAppUser[]) {
  await kvSet('whatsapp-users', users);
}

export async function POST(req: NextRequest) {
  const config = await getConfig();

  if (!config.twilio.enabled) {
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  const formData = await req.formData();
  const from = formData.get('From') as string; // whatsapp:+1234567890
  const body = (formData.get('Body') as string) || '';
  const profileName = (formData.get('ProfileName') as string) || 'Utilisateur';
  const numMedia = parseInt(formData.get('NumMedia') as string || '0', 10);
  const mediaUrl0 = formData.get('MediaUrl0') as string | null;
  const mediaContentType0 = formData.get('MediaContentType0') as string | null;

  // ── Handle voice messages (audio) via ElevenLabs STT ──────────────
  let messageText = body;
  let isVoiceMessage = false;
  if (numMedia > 0 && mediaUrl0 && mediaContentType0?.startsWith('audio/')) {
    isVoiceMessage = true;
    // Transcribe the voice message using ElevenLabs Scribe
    const sttResult = await transcribeWhatsAppAudio(mediaUrl0);
    if (sttResult.ok && sttResult.text) {
      messageText = sttResult.text;
      // Acknowledge to the user that we transcribed their voice
      // (don't send a separate message — just process the text)
    } else {
      // STT failed — tell the user
      await sendWhatsAppMessage({
        to: from,
        body: '⚠️ Je n\'ai pas pu transcrire votre message vocal. Pouvez-vous l\'envoyer en texte ?',
      });
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }
  }

  if (!messageText.trim()) {
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Track WhatsApp users (for welcome message + analytics)
  const waUsers = await readWhatsAppUsers();
  let waUser = waUsers.find((u) => u.phoneNumber === from);
  const isNewUser = !waUser;

  if (isNewUser) {
    waUser = {
      phoneNumber: from,
      name: profileName,
      firstMessageAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      messageCount: 0,
    };
    waUsers.push(waUser);
  }

  if (waUser) {
    waUser.lastMessageAt = new Date().toISOString();
    waUser.messageCount++;
  }
  await writeWhatsAppUsers(waUsers);

  // ── Per-user routing ──────────────────────────────────────────────
  // Look up the AfriLaunch user who connected this WhatsApp number.
  // If found, use THEIR agent config. Otherwise, use admin defaults.
  const userConfig = await getConfigByWhatsAppNumber(from);

  // Determine the welcome message (per-user or admin default)
  const welcomeMessage = userConfig?.firstMessage
    ? userConfig.firstMessage.replace(/\{businessName\}/g, userConfig.businessName || 'notre entreprise')
    : config.twilio.welcomeMessage;

  // Send welcome message to new users
  if (isNewUser && welcomeMessage) {
    await sendWhatsAppMessage({
      to: from,
      body: welcomeMessage,
    });
    await new Promise((r) => setTimeout(r, 1000));
  }

  // ── Auto-respond toggle ──────────────────────────────────────────
  // If the user disabled auto-respond, just acknowledge and stop.
  if (userConfig && !userConfig.autoRespond) {
    await sendWhatsAppMessage({
      to: from,
      body: '✅ Merci pour votre message ! Nous l\'avons bien reçu et vous répondrons manuellement prochainement.',
    });
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // ── Business hours check ─────────────────────────────────────────
  if (userConfig && !isWithinBusinessHours(userConfig)) {
    const outsideMsg = userConfig.businessHours.outsideHoursMessage || 'Nous sommes actuellement fermés. Nous vous répondrons à notre retour. 🌙';
    await sendWhatsAppMessage({
      to: from,
      body: outsideMsg,
    });
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // ── Build system prompt ──────────────────────────────────────────
  let systemPrompt: string;
  let maxTokens = 500;
  let aiProvider: 'auto' | 'openrouter' | 'mistral' = 'auto';

  if (userConfig && userConfig.enabled) {
    // Use the user's custom config
    systemPrompt = buildSystemPrompt(userConfig);
    maxTokens = Math.min(800, Math.ceil(userConfig.maxResponseLength / 2));
    aiProvider = userConfig.aiProvider || 'auto';
  } else {
    // Fallback: admin defaults (legacy behavior)
    systemPrompt = `Tu es l'assistant WhatsApp d'AfriLaunch AI. Réponds en français, de façon concise (max 1000 caractères). Tu aides les entrepreneurs africains. Tu es expert en business africain. Sois chaleureux, professionnel et actionnable. Si l'utilisateur demande de l'aide spécifique (marketing, branding, etc.), donne des conseils concrets.`;
  }

  // ── Generate AI response (provider selection) ────────────────────
  let response = '';
  try {
    if (aiProvider === 'mistral') {
      // Force Mistral provider (skip load balancer)
      response = await callMistralDirectly(systemPrompt, messageText, maxTokens);
    } else if (aiProvider === 'openrouter') {
      // Force OpenRouter provider
      response = await callOpenRouterDirectly(systemPrompt, messageText, maxTokens);
    } else {
      // 'auto' → use load balancer (OpenRouter → Mistral → Groq)
      const result = await runAIForPlanFast({
        systemPrompt,
        userMessage: messageText,
        maxTokens,
      }, 'starter');

      if (result.ok && result.reply) {
        response = result.reply;
      } else {
        console.error('WhatsApp AI error:', result.error);
        response = '⚠️ Désolé, je rencontre un problème technique. Réessayez dans un instant.';
      }
    }
  } catch (err) {
    console.error('WhatsApp AI exception:', err);
    response = '⚠️ Désolé, je rencontre un problème technique. Réessayez dans un instant.';
  }

  // Enforce max length (safety net)
  if (userConfig && response.length > userConfig.maxResponseLength) {
    response = response.slice(0, userConfig.maxResponseLength - 3) + '...';
  }

  await sendWhatsAppMessage({
    to: from,
    body: response,
  });

  // ── Voice response (TTS) — if the user sent a voice message ──────
  // When the incoming message was a voice note, we also send the response
  // as a voice message (audio MP3) using ElevenLabs TTS.
  if (isVoiceMessage && config.elevenlabs?.apiKey) {
    try {
      const ttsResult = await generateVoiceResponse(response);
      if (ttsResult.ok && ttsResult.audioDataUrl) {
        // Store the audio temporarily and send via media endpoint
        // We need a public URL — store in KV and serve via /api/whatsapp-agent/media
        const audioId = 'voice_' + Date.now().toString(36);
        await kvSet(`whatsapp-voice-${audioId}`, {
          dataUrl: ttsResult.audioDataUrl,
          createdAt: Date.now(),
        });
        const appUrl = config.appUrl || `https://${req.headers.get('host') || 'afrilaunchia.vercel.app'}`;
        const voiceUrl = `${appUrl}/api/whatsapp-agent/voice/${audioId}`;
        await sendWhatsAppMedia({
          to: from,
          mediaUrl: voiceUrl,
        });
      }
    } catch (err) {
      console.error('TTS voice response failed:', err);
      // Silent fail — text response already sent
    }
  }

  // ── Send product images if the response mentions catalog products ──
  // After sending the text response, we check if any product from the
  // user's catalog is mentioned in the response. If so, we send the
  // product image as a separate WhatsApp media message.
  if (userConfig && userConfig.catalog.length > 0) {
    const mentionedProducts = findMentionedProducts(response, userConfig.catalog);
    for (const product of mentionedProducts.slice(0, 3)) { // max 3 images per response
      if (product.imageUrl) {
        try {
          // Build public URL for Twilio to fetch
          // Twilio requires an HTTPS URL — use our media endpoint
          const appUrl = config.appUrl || `https://${req.headers.get('host') || 'afrilaunchia.vercel.app'}`;
          const mediaUrl = `${appUrl}/api/whatsapp-agent/media/${product.id}?userId=${userConfig.userId}`;
          await sendWhatsAppMedia({
            to: from,
            mediaUrl,
            caption: `📸 ${product.name}\n💰 ${product.price}${product.description ? `\n📝 ${product.description}` : ''}`,
          });
        } catch (err) {
          console.error('Failed to send product image:', err);
        }
      }
    }
  }

  return new NextResponse('<Response></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

// ─── Detect which catalog products are mentioned in the AI response ────
// We do a case-insensitive search for the product name (or a significant
// part of it) in the response. This is intentionally simple — the AI is
// instructed to use exact product names, so a substring match is reliable.
function findMentionedProducts(response: string, catalog: CatalogProduct[]): CatalogProduct[] {
  const lower = response.toLowerCase();
  const mentioned: CatalogProduct[] = [];
  for (const product of catalog) {
    if (!product.name || product.name.length < 3) continue;
    // Match the product name (case-insensitive)
    if (lower.includes(product.name.toLowerCase())) {
      mentioned.push(product);
      continue;
    }
    // Also match significant words from the name (4+ chars, not common words)
    const words = product.name.toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
    const commonWords = ['avec', 'pour', 'dans', 'sur', 'les', 'des', 'une', 'aux'];
    const significantWords = words.filter((w) => !commonWords.includes(w));
    if (significantWords.length > 0 && significantWords.every((w) => lower.includes(w))) {
      mentioned.push(product);
    }
  }
  return mentioned;
}

// ─── Direct provider calls (when user forces a specific provider) ─────
// These bypass the load balancer to honor the user's `aiProvider` choice.

async function callMistralDirectly(systemPrompt: string, userMessage: string, maxTokens: number): Promise<string> {
  const config = await getConfig();
  const mistral = config.ai.providers.mistral;
  if (!mistral?.apiKey) {
    // Fallback to load balancer if Mistral not configured
    console.warn('Mistral not configured, falling back to load balancer');
    const result = await runAIForPlanFast({ systemPrompt, userMessage, maxTokens }, 'starter');
    return result.ok && result.reply ? result.reply : '⚠️ Service temporairement indisponible.';
  }
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistral.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error('Mistral error:', res.status, errBody);
      // Fallback to load balancer
      const result = await runAIForPlanFast({ systemPrompt, userMessage, maxTokens }, 'starter');
      return result.ok && result.reply ? result.reply : '⚠️ Service temporairement indisponible.';
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '⚠️ Réponse vide.';
  } catch (err) {
    console.error('Mistral exception:', err);
    const result = await runAIForPlanFast({ systemPrompt, userMessage, maxTokens }, 'starter');
    return result.ok && result.reply ? result.reply : '⚠️ Service temporairement indisponible.';
  }
}

async function callOpenRouterDirectly(systemPrompt: string, userMessage: string, maxTokens: number): Promise<string> {
  const config = await getConfig();
  const openrouter = config.ai.providers.openrouter;
  if (!openrouter?.apiKey) {
    console.warn('OpenRouter not configured, falling back to load balancer');
    const result = await runAIForPlanFast({ systemPrompt, userMessage, maxTokens }, 'starter');
    return result.ok && result.reply ? result.reply : '⚠️ Service temporairement indisponible.';
  }
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouter.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://afrilaunch.ai',
        'X-Title': 'AfriLaunch AI',
      },
      body: JSON.stringify({
        model: 'minimax/minimax-m3:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error('OpenRouter error:', res.status, errBody);
      const result = await runAIForPlanFast({ systemPrompt, userMessage, maxTokens }, 'starter');
      return result.ok && result.reply ? result.reply : '⚠️ Service temporairement indisponible.';
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '⚠️ Réponse vide.';
  } catch (err) {
    console.error('OpenRouter exception:', err);
    const result = await runAIForPlanFast({ systemPrompt, userMessage, maxTokens }, 'starter');
    return result.ok && result.reply ? result.reply : '⚠️ Service temporairement indisponible.';
  }
}
