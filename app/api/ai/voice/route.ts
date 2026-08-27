// AfriLaunch AI — ElevenLabs Voice generation API
// POST /api/ai/voice — generate audio from text using ElevenLabs
// Returns audio/mpeg directly

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { requireUser } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const config = await getConfig();
  if (!config.elevenlabs.enabled || !config.elevenlabs.apiKey) {
    return NextResponse.json({ error: 'ElevenLabs non configuré. Activez-le dans /admin/ai' }, { status: 400 });
  }

  let body: { text?: string; voiceId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const text = (body.text || '').trim();
  if (!text) return NextResponse.json({ error: 'Texte requis' }, { status: 400 });
  if (text.length > 5000) return NextResponse.json({ error: 'Texte trop long (max 5000 caractères)' }, { status: 400 });

  const voiceId = body.voiceId || config.elevenlabs.voiceId;

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': config.elevenlabs.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: config.elevenlabs.model,
        voice_settings: {
          stability: config.elevenlabs.stability,
          similarity_boost: config.elevenlabs.similarityBoost,
          style: config.elevenlabs.style,
        },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      let errMsg = `HTTP ${res.status}`;
      try { const j = JSON.parse(errBody); errMsg = j.detail?.message || j.message || errMsg; } catch { /* not JSON */ }
      if (res.status === 401) return NextResponse.json({ error: 'Clé API ElevenLabs invalide' }, { status: 401 });
      if (res.status === 422) return NextResponse.json({ error: `Voice ID invalide: ${voiceId}` }, { status: 422 });
      return NextResponse.json({ error: `ElevenLabs: ${errMsg}` }, { status: 500 });
    }

    // Return audio as base64 data URL (so client can play/download without file storage)
    const audioBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString('base64');
    const dataUrl = `data:audio/mpeg;base64,${base64}`;

    return NextResponse.json({
      ok: true,
      audioUrl: dataUrl,
      duration: Math.ceil(text.length / 15), // rough estimate in seconds
      voiceId,
      model: config.elevenlabs.model,
    });
  } catch (err) {
    return NextResponse.json({ error: `Erreur réseau: ${(err as Error).message}` }, { status: 500 });
  }
}
