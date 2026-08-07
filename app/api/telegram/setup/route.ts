// AfriLaunch AI — Telegram setup endpoint
// POST   /api/telegram/setup   — set webhook (requires admin auth)
// DELETE /api/telegram/setup   — delete webhook (requires admin auth)
// GET    /api/telegram/setup   — get webhook info (requires admin auth)

import { NextRequest, NextResponse } from 'next/server';
import { getConfig, validateSession } from '@/lib/config-store';

async function requireAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

export async function GET(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const config = await getConfig();
  if (!config.telegram.botToken) {
    return NextResponse.json({ ok: false, error: 'Bot token non configuré' });
  }

  // Get webhook info from Telegram
  try {
    const res = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/getWebhookInfo`);
    const data = await res.json();
    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.description || 'Erreur Telegram API' });
    }
    // Also get bot info
    const meRes = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/getMe`);
    const meData = await meRes.json();
    return NextResponse.json({
      ok: true,
      webhook: data.result,
      bot: meData.ok ? meData.result : null,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: `Erreur réseau: ${(err as Error).message}` });
  }
}

export async function POST(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const config = await getConfig();
  if (!config.telegram.botToken) {
    return NextResponse.json({ ok: false, error: 'Bot token non configuré. Ajoutez-le d\'abord.' });
  }

  let body: { webhookUrl?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const baseUrl = body.webhookUrl || config.appUrl;
  if (!baseUrl) {
    return NextResponse.json({ ok: false, error: 'URL de l\'app non configurée. Définissez-la dans /admin/general' });
  }

  const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram/webhook?secret=${config.telegram.webhookSecret}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'edited_message'],
        max_connections: 40,
        drop_pending_updates: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.description || 'Erreur setWebhook' });
    }
    return NextResponse.json({
      ok: true,
      message: 'Webhook configuré',
      webhookUrl,
      description: data.description,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: `Erreur réseau: ${(err as Error).message}` });
  }
}

export async function DELETE(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const config = await getConfig();
  if (!config.telegram.botToken) {
    return NextResponse.json({ ok: false, error: 'Bot token non configuré' });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: true }),
    });
    const data = await res.json();
    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.description || 'Erreur deleteWebhook' });
    }
    return NextResponse.json({ ok: true, message: 'Webhook supprimé' });
  } catch (err) {
    return NextResponse.json({ ok: false, error: `Erreur réseau: ${(err as Error).message}` });
  }
}
