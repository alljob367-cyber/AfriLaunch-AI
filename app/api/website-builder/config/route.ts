// AfriLaunch AI — Website Builder config API
// GET  /api/website-builder/config → list user's website configs
// POST /api/website-builder/config → create/update config
// DELETE /api/website-builder/config?id=xxx → delete

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getUserConfigs, upsertConfig, deleteConfig, getDefaultConfig } from '@/lib/website-builder';
import { assembleWebsiteHtml } from '@/lib/website-assembler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const configs = await getUserConfigs(user.id);
  return NextResponse.json({ ok: true, configs });
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  // Create new or update existing
  let config;
  if (body.id) {
    // Update existing
    const { upsertConfig } = await import('@/lib/website-builder');
    const { getConfig } = await import('@/lib/website-builder');
    const existing = await getConfig(body.id);
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Config introuvable' }, { status: 404 });
    }
    config = { ...existing, ...body, userId: user.id };
  } else {
    // Create new
    config = getDefaultConfig(user.id);
    Object.assign(config, body, { userId: user.id });
  }

  // If generate=true, assemble the HTML
  if (body.generate) {
    const { runAIForPlanStream } = await import('@/lib/ai-runner');
    const { getOrganizationByUserId } = await import('@/lib/org-store');

    // Pre-fill from org if empty
    if (!config.businessName) {
      try {
        const org = await getOrganizationByUserId(user.id);
        if (org) {
          config.businessName = config.businessName || org.name;
          config.industry = config.industry || org.industry;
          config.country = config.country || org.country;
          config.contactEmail = config.contactEmail || org.email;
          config.contactPhone = config.contactPhone || org.phone;
          config.contactAddress = config.contactAddress || org.address;
        }
      } catch { /* ignore */ }
    }

    // If no tagline/description, ask AI to generate
    if (!config.tagline || !config.description) {
      try {
        let fullJson = '';
        for await (const evt of runAIForPlanStream({
          systemPrompt: `Tu es un expert en marketing pour le marché africain. Génère un tagline et une description pour un site web.
Format JSON: {"tagline":"string max 80 chars","description":"string max 200 chars"}
Adapte au type de business: ${config.businessType}, nom: ${config.businessName}, industrie: ${config.industry}.
Réponds UNIQUEMENT avec le JSON.`,
          userMessage: `Génère tagline + description pour ${config.businessName} (${config.industry}, ${config.country}).`,
          maxTokens: 300,
        }, user.plan as any)) {
          if (evt.chunk) fullJson += evt.chunk;
        }
        const parsed = JSON.parse(fullJson.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim());
        config.tagline = config.tagline || parsed.tagline;
        config.description = config.description || parsed.description;
      } catch { /* ignore — use defaults */ }
    }

    // Assemble HTML
    config.generatedHtml = assembleWebsiteHtml(config);
    config.generatedAt = Date.now();
  }

  const saved = await upsertConfig(config);

  return NextResponse.json({
    ok: true,
    config: saved,
    hasHtml: !!saved.generatedHtml,
  });
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const ok = await deleteConfig(user.id, id);
  if (!ok) return NextResponse.json({ error: 'Config introuvable' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
