// AfriLaunch AI — Admin password change API
import { NextRequest, NextResponse } from 'next/server';
import { updateConfig, validateSession, hashPassword } from '@/lib/config-store';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token || !(await validateSession(token))) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: { newPassword?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const newPassword = body.newPassword;
  if (!newPassword || typeof newPassword !== 'string') {
    return NextResponse.json({ error: 'Nouveau mot de passe requis' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Mot de passe trop court (min 8 caractères)' }, { status: 400 });
  }

  const hash = hashPassword(newPassword);
  await updateConfig({ adminPasswordHash: hash });

  return NextResponse.json({ ok: true, message: 'Mot de passe mis à jour' });
}
