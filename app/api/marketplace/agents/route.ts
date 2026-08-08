// AfriLaunch AI — Marketplace agents API
// GET /api/marketplace/agents — list all marketplace agents (public, optional ?category= filter).

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';

export async function GET(req: NextRequest) {
  try {
    const config = await getConfig();
    const url = new URL(req.url);
    const category = url.searchParams.get('category')?.trim().toLowerCase();

    let agents = config.marketplace.agents;
    if (category) {
      agents = agents.filter((a) => a.category.toLowerCase() === category);
    }

    return NextResponse.json({
      enabled: config.marketplace.enabled,
      revenueSharePercent: config.marketplace.revenueSharePercent,
      count: agents.length,
      agents,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
