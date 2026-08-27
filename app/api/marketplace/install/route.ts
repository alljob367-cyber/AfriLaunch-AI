// AfriLaunch AI — Marketplace install API
// POST   /api/marketplace/install — install an agent { agentId }.
// DELETE /api/marketplace/install — uninstall an agent { agentId }.

import { NextRequest, NextResponse } from 'next/server';
import { installAgent, uninstallAgent, sanitizeUser } from '@/lib/user-store';
import { getConfig } from '@/lib/config-store';
import { requireUser } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    const { agentId } = body as { agentId?: string };
    if (!agentId) {
      return NextResponse.json({ error: 'agentId requis' }, { status: 400 });
    }

    // Validate agent exists in marketplace
    const config = await getConfig();
    const exists = config.marketplace.agents.some((a) => a.id === agentId);
    if (!exists) {
      return NextResponse.json({ error: 'Agent introuvable dans le marketplace' }, { status: 404 });
    }

    const updated = await installAgent(user.id, String(agentId));
    if (!updated) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: sanitizeUser(updated) });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Body may be JSON or query params
    let agentId: string | undefined;
    const url = new URL(req.url);
    agentId = url.searchParams.get('agentId') ?? undefined;

    if (!agentId) {
      const body = await req.json().catch(() => null);
      agentId = body?.agentId;
    }

    if (!agentId) {
      return NextResponse.json({ error: 'agentId requis' }, { status: 400 });
    }

    const updated = await uninstallAgent(user.id, String(agentId));
    if (!updated) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: sanitizeUser(updated) });
  } catch (err) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (err as Error).message },
      { status: 500 },
    );
  }
}
