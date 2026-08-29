// AfriLaunch AI — List available ElevenLabs voices
// GET /api/elevenlabs/voices → { ok, voices: [...] }
//
// Returns the list of voices accessible with the configured API key.
// Free tier users can only use "premade" voices — library voices
// (like Rachel 21m00Tcm4TlvDq8ikWAM) require a paid plan.

import { NextRequest, NextResponse } from 'next/server';
import { getConfig, validateSession } from '@/lib/config-store';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ok = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const config = await getConfig();
  if (!config.elevenlabs.apiKey) {
    return NextResponse.json({ error: 'ElevenLabs non configuré' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': config.elevenlabs.apiKey },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      return NextResponse.json({ error: `ElevenLabs: HTTP ${res.status} ${errBody.slice(0, 200)}` }, { status: res.status });
    }

    const data = await res.json();
    const voices = (data.voices || []).map((v: any) => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category, // 'premade' | 'cloned' | 'generated' | 'professional'
      labels: v.labels || {},
      preview_url: v.preview_url,
    }));

    // Sort: premade first (those are the ones free tier can use)
    voices.sort((a: any, b: any) => {
      if (a.category === 'premade' && b.category !== 'premade') return -1;
      if (a.category !== 'premade' && b.category === 'premade') return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      ok: true,
      voices,
      count: voices.length,
      premadeCount: voices.filter((v: any) => v.category === 'premade').length,
      note: voices.filter((v: any) => v.category === 'premade').length === 0
        ? 'Aucune voix premade trouvée. Votre clé ne semble pas avoir accès aux voix gratuites. Vérifiez votre compte sur elevenlabs.io.'
        : `${voices.filter((v: any) => v.category === 'premade').length} voix premade disponibles (free tier).`,
    });
  } catch (err) {
    return NextResponse.json({ error: `Erreur réseau: ${(err as Error).message}` }, { status: 500 });
  }
}
