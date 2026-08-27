// AfriLaunch AI — Public WhatsApp agent status (no auth needed)
// GET /api/whatsapp-agent/status — returns WhatsApp number + availability

import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { kvGet } from '@/lib/db';

export async function GET() {
  const config = await getConfig();

  if (!config.twilio.enabled || !config.twilio.whatsappNumber) {
    return NextResponse.json({
      enabled: false,
      whatsappNumber: null,
      message: 'WhatsApp Agent non configuré',
    });
  }

  // Count active WhatsApp users (stored in kv_store under 'whatsapp-users')
  const users = (await kvGet<any[]>('whatsapp-users')) ?? [];
  const userCount = users.length;

  return NextResponse.json({
    enabled: true,
    whatsappNumber: config.twilio.whatsappNumber,
    whatsappLink: `https://wa.me/${config.twilio.whatsappNumber.replace(/[^0-9]/g, '')}`,
    freeForAll: config.twilio.freeForAll,
    userCount,
    message: 'Envoyez un message WhatsApp pour discuter avec l\'IA',
  });
}
