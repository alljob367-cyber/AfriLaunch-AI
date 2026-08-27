// AfriLaunch AI — WhatsApp agent test endpoint
// POST /api/whatsapp-agent/test — send a test message and get AI response

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/config-store';
import { processWhatsAppWithElevenLabs } from '@/lib/elevenlabs-agent';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token || !(await validateSession(token))) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: { message?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const message = body.message || 'Bonjour, présentez-vous';
  const result = await processWhatsAppWithElevenLabs(message, 'Admin Test');

  return NextResponse.json(result);
}
