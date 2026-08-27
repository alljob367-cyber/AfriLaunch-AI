// AfriLaunch AI — Twilio WhatsApp webhook
// POST /api/whatsapp-agent/webhook — receives WhatsApp messages from Twilio
// Forwards to ElevenLabs agent, sends response back via Twilio

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { processWhatsAppWithElevenLabs, sendWhatsAppMessage } from '@/lib/elevenlabs-agent';

export async function POST(req: NextRequest) {
  const config = await getConfig();

  if (!config.twilio.enabled) {
    return NextResponse.json({ error: 'WhatsApp agent disabled' }, { status: 403 });
  }

  // Twilio sends form-encoded data
  const formData = await req.formData();
  const from = formData.get('From') as string; // whatsapp:+1234567890
  const body = formData.get('Body') as string;
  const mediaUrl = formData.get('MediaUrl0') as string | null; // voice message audio
  const profileName = formData.get('ProfileName') as string;

  if (!body && !mediaUrl) {
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  const userMessage = body || '[Message vocal reçu — transcription requise]';
  const senderName = profileName || from;

  // Process the message with ElevenLabs agent / AI
  const result = await processWhatsAppWithElevenLabs(userMessage, senderName);

  if (!result.ok || !result.response) {
    // Send error message
    await sendWhatsAppMessage({
      to: from,
      body: `⚠️ Désolé, je n'ai pas pu traiter votre message. Erreur: ${result.error || 'inconnue'}`,
    });
  } else {
    // Send the AI response via Twilio WhatsApp
    await sendWhatsAppMessage({
      to: from,
      body: result.response,
    });
  }

  // Return empty TwiML (we already sent the message via API)
  return new NextResponse('<Response></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}
