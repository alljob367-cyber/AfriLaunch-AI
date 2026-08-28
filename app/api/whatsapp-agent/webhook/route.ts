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
import { runAIForPlanFast } from '@/lib/ai-runner';

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

  if (userConfig && userConfig.enabled) {
    // Use the user's custom config
    systemPrompt = buildSystemPrompt(userConfig);
    maxTokens = Math.min(800, Math.ceil(userConfig.maxResponseLength / 2));
  } else {
    // Fallback: admin defaults (legacy behavior)
    systemPrompt = `Tu es l'assistant WhatsApp d'AfriLaunch AI. Réponds en français, de façon concise (max 1000 caractères). Tu aides les entrepreneurs africains. Tu es expert en business africain. Sois chaleureux, professionnel et actionnable. Si l'utilisateur demande de l'aide spécifique (marketing, branding, etc.), donne des conseils concrets.`;
  }

  // ── Generate AI response ─────────────────────────────────────────
  let response = '';
  try {
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
