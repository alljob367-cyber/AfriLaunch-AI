// AfriLaunch AI — Public voice response endpoint
// GET /api/whatsapp-agent/voice/[audioId]
//
// Serves TTS-generated audio (MP3) stored temporarily in KV.
// Twilio fetches this URL to send the voice message on WhatsApp.

import { NextRequest, NextResponse } from 'next/server';
import { kvGet } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ audioId: string }> },
) {
  const { audioId } = await params;
  if (!audioId) {
    return new NextResponse('Missing audioId', { status: 400 });
  }

  const entry = await kvGet<{ dataUrl: string; createdAt: number }>(`whatsapp-voice-${audioId}`);
  if (!entry || !entry.dataUrl) {
    return new NextResponse('Audio not found', { status: 404 });
  }

  // Drop entries older than 1 hour (cleanup)
  if (Date.now() - entry.createdAt > 60 * 60 * 1000) {
    return new NextResponse('Audio expired', { status: 410 });
  }

  // dataUrl = "data:audio/mpeg;base64,...."
  const match = entry.dataUrl.match(/^data:audio\/([a-z]+);base64,(.+)$/i);
  if (!match) {
    return new NextResponse('Invalid audio format', { status: 400 });
  }

  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
      'Content-Length': String(buffer.length),
    },
  });
}
