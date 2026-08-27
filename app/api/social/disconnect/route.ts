// AfriLaunch AI — Disconnect social account
// POST /api/social/disconnect { platform }
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { disconnectSocialAccount, type SocialPlatform } from '@/lib/social-store';

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { platform?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const platform = body.platform as SocialPlatform;
  const ok = await disconnectSocialAccount(user.id, platform);
  if (!ok) return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
