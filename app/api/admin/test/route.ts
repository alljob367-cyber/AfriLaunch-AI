// AfriLaunch AI — Connection test API
// POST /api/admin/test — test a specific provider/connection
// Body: { type: 'database' | 'ai' | 'payment' | 'email', provider?: string }

import { NextRequest, NextResponse } from 'next/server';
import {
  getConfig, validateSession,
  testDatabase, testAiProvider, testPaymentProvider, testEmailProvider,
} from '@/lib/config-store';

async function requireAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

export async function POST(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { type: string; provider?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const config = await getConfig();

  switch (body.type) {
    case 'database':
      return NextResponse.json(await testDatabase(config));
    case 'ai':
      if (!body.provider) return NextResponse.json({ error: 'Provider requis' }, { status: 400 });
      return NextResponse.json(await testAiProvider(config, body.provider));
    case 'payment':
      if (!body.provider) return NextResponse.json({ error: 'Provider requis' }, { status: 400 });
      return NextResponse.json(await testPaymentProvider(config, body.provider));
    case 'email':
      return NextResponse.json(await testEmailProvider(config));
    default:
      return NextResponse.json({ error: 'Type de test inconnu' }, { status: 400 });
  }
}
