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
import { sendWhatsAppMessage } from '@/lib/elevenlabs-agent';
import { kvGet, kvSet } from '@/lib/db';
import {
  getConfigByWhatsAppNumber,
  buildSystemPrompt,
  isWithinBusinessHours,
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

  if (!body.trim()) {
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
      response = await callMistralDirectly(systemPrompt, body, maxTokens);
    } else if (aiProvider === 'openrouter') {
      // Force OpenRouter provider
      response = await callOpenRouterDirectly(systemPrompt, body, maxTokens);
    } else {
      // 'auto' → use load balancer (OpenRouter → Mistral → Groq)
      const result = await runAIForPlanFast({
        systemPrompt,
        userMessage: body,
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

  return new NextResponse('<Response></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
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
