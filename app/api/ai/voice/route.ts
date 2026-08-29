// AfriLaunch AI — ElevenLabs Voice generation API
// POST /api/ai/voice — generate audio from text using ElevenLabs
// Returns audio/mpeg directly
//
// Auth: accepts EITHER user session OR admin session (so the admin can test
// from /admin/ai without needing a separate user login).

import { NextRequest, NextResponse } from 'next/server';
import { getConfig, validateSession } from '@/lib/config-store';
import { requireUser } from '@/lib/auth-helpers';

async function requireUserOrAdmin(req: NextRequest): Promise<boolean> {
  // Try user session first
  const user = await requireUser(req);
  if (user) return true;
  // Fall back to admin session
  const adminToken = req.cookies.get('afrilaunch_admin')?.value;
  if (adminToken && await validateSession(adminToken)) return true;
  return false;
}

export async function POST(req: NextRequest) {
  const isAuthed = await requireUserOrAdmin(req);
  if (!isAuthed) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const config = await getConfig();
  if (!config.elevenlabs.enabled || !config.elevenlabs.apiKey) {
    return NextResponse.json({ error: 'ElevenLabs non configuré. Activez-le dans /admin/ai' }, { status: 400 });
  }

  let body: { text?: string; voiceId?: string; model?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const text = (body.text || '').trim();
  if (!text) return NextResponse.json({ error: 'Texte requis' }, { status: 400 });
  if (text.length > 5000) return NextResponse.json({ error: 'Texte trop long (max 5000 caractères)' }, { status: 400 });

  const voiceId = body.voiceId || config.elevenlabs.voiceId;
  const model = body.model || config.elevenlabs.model || 'eleven_turbo_v2_5';

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
        model_id: model,
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
      if (res.status === 401) return NextResponse.json({ error: 'Clé API ElevenLabs invalide (401). Vérifiez votre clé sur elevenlabs.io' }, { status: 401 });
      if (res.status === 403) return NextResponse.json({ error: 'Accès refusé (403). Votre plan ElevenLabs ne supporte peut-être pas ce modèle ou cette voix.' }, { status: 403 });
      if (res.status === 404) return NextResponse.json({ error: `Voice ID invalide: ${voiceId} (404). Utilisez un voice ID de votre compte ElevenLabs.` }, { status: 404 });
      if (res.status === 405) return NextResponse.json({ error: `ElevenLabs: méthode non autorisée (405). Le modèle "${config.elevenlabs.model}" ou le voice ID "${voiceId}" n'est pas accessible avec votre clé. Essayez le modèle "eleven_turbo_v2_5" et le voice ID "21m00Tcm4TlvDq8ikWAM" (Rachel).` }, { status: 500 });
      if (res.status === 422) return NextResponse.json({ error: `Voice ID invalide: ${voiceId} (422)` }, { status: 422 });
      if (res.status === 429) return NextResponse.json({ error: 'Quota ElevenLabs dépassé (429). Le free tier est limité à 10 000 caractères/mois.' }, { status: 429 });
      return NextResponse.json({ error: `ElevenLabs: ${errMsg}` }, { status: 500 });
    }

    // Return audio as base64 data URL (so client can play/download without file storage)
    const audioBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString('base64');
    const dataUrl = `data:audio/mpeg;base64,${base64}`;

    return NextResponse.json({
      ok: true,
      audioUrl: dataUrl,
      duration: Math.ceil(text.length / 15),
      voiceId,
      model,
    });
  } catch (err) {
    return NextResponse.json({ error: `Erreur réseau: ${(err as Error).message}` }, { status: 500 });
  }
}
