// AfriLaunch AI — Connect social account
// POST /api/social/connect { platform, handle, displayName? }
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { connectSocialAccount, sanitizeAccount, type SocialPlatform } from '@/lib/social-store';

const VALID_PLATFORMS: SocialPlatform[] = ['instagram', 'tiktok', 'facebook', 'whatsapp', 'linkedin', 'twitter'];

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { platform?: string; handle?: string; displayName?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const platform = body.platform as SocialPlatform;
  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: 'Plateforme invalide' }, { status: 400 });
  }

  const handle = (body.handle || '').trim().replace(/^@/, '');
  if (!handle) {
    return NextResponse.json({ error: 'Nom d\'utilisateur requis' }, { status: 400 });
  }

  const account = await connectSocialAccount(user.id, platform, handle, body.displayName);
  return NextResponse.json({ ok: true, account: sanitizeAccount(account) });
}
