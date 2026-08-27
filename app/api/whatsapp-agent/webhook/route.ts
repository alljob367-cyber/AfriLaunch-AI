// AfriLaunch AI — Twilio WhatsApp webhook
// POST /api/whatsapp-agent/webhook — receives WhatsApp messages from Twilio
// Forwards to AI, sends response back via Twilio
// NO CONFIGURATION NEEDED BY USERS — they just send a WhatsApp message

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { processWhatsAppWithElevenLabs, sendWhatsAppMessage } from '@/lib/elevenlabs-agent';
import { kvGet, kvSet } from '@/lib/db';

interface WhatsAppUser {
  phoneNumber: string;
  name: string;
  firstMessageAt: string;
  lastMessageAt: string;
  messageCount: number;
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

  // If freeForAll is enabled, skip credit checks entirely
  // If not, we would check if the user has an AfriLaunch account + credits
  // For now, we default to freeForAll = true so EVERYONE can use it

  // Send welcome message to new users
  if (isNewUser && config.twilio.welcomeMessage) {
    await sendWhatsAppMessage({
      to: from,
      body: config.twilio.welcomeMessage,
    });
    // Small delay before processing the actual message
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Process the message with AI
  const result = await processWhatsAppWithElevenLabs(body, profileName);

  if (!result.ok || !result.response) {
    await sendWhatsAppMessage({
      to: from,
      body: `⚠️ Désolé, je n'ai pas pu traiter votre message. Réessayez dans un instant.`,
    });
  } else {
    await sendWhatsAppMessage({
      to: from,
      body: result.response,
    });
  }

  return new NextResponse('<Response></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}
