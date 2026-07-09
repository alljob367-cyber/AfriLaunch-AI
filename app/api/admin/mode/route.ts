// AfriLaunch AI — Public mode endpoint
// GET /api/admin/mode — returns only the mode + app name (no auth required)
// Used by the ModeIndicator component in the main app to show DEMO/REAL badge.

import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';

export async function GET() {
  const config = await getConfig();
  // Only expose non-sensitive fields
  return NextResponse.json({
    mode: config.mode,
    appName: config.appName,
  });
}
