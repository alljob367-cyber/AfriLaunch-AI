// AfriLaunch AI — Telegram status endpoint (public, for the admin page)
// GET /api/telegram/status — returns bot status (requires admin auth)

import { NextRequest, NextResponse } from 'next/server';
import { getConfig, validateSession } from '@/lib/config-store';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token || !(await validateSession(token))) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const config = await getConfig();
  const hasToken = !!config.telegram.botToken;
  const enabled = config.telegram.enabled;

  if (!hasToken) {
    return NextResponse.json({
      ok: true,
      configured: false,
      enabled,
      hasToken: false,
      defaultAgent: config.telegram.defaultAgent,
      webhookSecret: config.telegram.webhookSecret,
      webhookUrl: '',
    });
  }

  // Get webhook info + bot info from Telegram
  try {
    const [webhookRes, meRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${config.telegram.botToken}/getWebhookInfo`),
      fetch(`https://api.telegram.org/bot${config.telegram.botToken}/getMe`),
    ]);
    const webhookData = await webhookRes.json();
    const meData = await meRes.json();

    return NextResponse.json({
      ok: true,
      configured: true,
      enabled,
      hasToken: true,
      bot: meData.ok ? meData.result : null,
      webhook: webhookData.ok ? webhookData.result : null,
      defaultAgent: config.telegram.defaultAgent,
      webhookSecret: config.telegram.webhookSecret,
      webhookUrl: config.appUrl ? `${config.appUrl.replace(/\/$/, '')}/api/telegram/webhook?secret=${config.telegram.webhookSecret}` : '',
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: `Erreur réseau: ${(err as Error).message}`,
      configured: true,
      enabled,
      hasToken: true,
    });
  }
}
