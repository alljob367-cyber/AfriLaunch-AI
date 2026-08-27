// AfriLaunch AI — Public WhatsApp agent status (no auth needed)
// GET /api/whatsapp-agent/status — returns WhatsApp number + availability

import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { promises as fs } from 'fs';
import path from 'path';

const WHATSAPP_USERS_PATH = path.join('/home/z/my-project/data', 'whatsapp-users.json');

export async function GET() {
  const config = await getConfig();

  if (!config.twilio.enabled || !config.twilio.whatsappNumber) {
    return NextResponse.json({
      enabled: false,
      whatsappNumber: null,
      message: 'WhatsApp Agent non configuré',
    });
  }

  // Count active WhatsApp users
  let userCount = 0;
  try {
    const raw = await fs.readFile(WHATSAPP_USERS_PATH, 'utf-8');
    const users = JSON.parse(raw) as any[];
    userCount = users.length;
  } catch { /* no users yet */ }

  return NextResponse.json({
    enabled: true,
    whatsappNumber: config.twilio.whatsappNumber,
    whatsappLink: `https://wa.me/${config.twilio.whatsappNumber.replace(/[^0-9]/g, '')}`,
    freeForAll: config.twilio.freeForAll,
    userCount,
    message: 'Envoyez un message WhatsApp pour discuter avec l\'IA',
  });
}
