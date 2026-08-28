// AfriLaunch AI — WhatsApp Agent per-user config
// GET  /api/whatsapp-agent/config → returns the user's config (or defaults)
// PUT  /api/whatsapp-agent/config → updates the user's config
// POST /api/whatsapp-agent/config?action=test → sends a test message to the agent

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getUserConfig, upsertUserConfig, buildSystemPrompt } from '@/lib/whatsapp-agent-store';
import { getOrganizationByUserId } from '@/lib/org-store';
import { runAIForPlanFast } from '@/lib/ai-runner';
import type { PlanId } from '@/lib/user-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let cfg = await getUserConfig(user.id);

  // Auto-fill business fields from organization if empty
  if (!cfg.businessName || !cfg.industry) {
    try {
      const org = await getOrganizationByUserId(user.id);
      if (org) {
        const updates: any = {};
        if (!cfg.businessName && org.name) updates.businessName = org.name;
        if (!cfg.industry && org.industry) updates.industry = org.industry;
        if (!cfg.country || cfg.country === 'Afrique') updates.country = org.country || 'Afrique';
        if (!cfg.contactInfo && (org.email || org.phone)) {
          updates.contactInfo = [org.email, org.phone, org.address].filter(Boolean).join(' · ');
        }
        if (Object.keys(updates).length > 0) {
          cfg = await upsertUserConfig(user.id, updates);
        }
      }
    } catch { /* ignore */ }
  }

  return NextResponse.json({ ok: true, config: cfg });
}

export async function PUT(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  // Whitelist allowed fields (prevent userId overwrite etc.)
  const allowed = [
    'enabled', 'agentName', 'systemPrompt', 'tone', 'language', 'firstMessage',
    'maxResponseLength', 'businessName', 'industry', 'country', 'services',
    'pricing', 'contactInfo', 'autoRespond', 'businessHours', 'faq',
  ] as const;
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  // Validate arrays
  if (updates.services && !Array.isArray(updates.services)) {
    updates.services = [];
  }
  if (updates.faq) {
    if (!Array.isArray(updates.faq)) {
      updates.faq = [];
    } else {
      // Ensure each FAQ entry has an id
      updates.faq = updates.faq.map((f: any, i: number) => ({
        id: f.id || `faq_${Date.now()}_${i}`,
        question: String(f.question || '').slice(0, 300),
        answer: String(f.answer || '').slice(0, 1000),
      })).filter((f: any) => f.question && f.answer);
    }
  }
  if (updates.maxResponseLength) {
    updates.maxResponseLength = Math.min(2000, Math.max(300, Number(updates.maxResponseLength) || 1000));
  }

  const cfg = await upsertUserConfig(user.id, updates);

  return NextResponse.json({ ok: true, config: cfg });
}

// POST ?action=test — test the agent with a sample message
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { message?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const message = (body.message || 'Bonjour, présentez-vous').trim();
  const cfg = await getUserConfig(user.id);

  if (!cfg.enabled) {
    return NextResponse.json({ error: 'Agent désactivé. Activez-le dans la configuration.' }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(cfg);
  const result = await runAIForPlanFast({
    systemPrompt,
    userMessage: message,
    maxTokens: Math.min(800, Math.ceil(cfg.maxResponseLength / 2)),
  }, user.plan as PlanId);

  if (!result.ok || !result.reply) {
    return NextResponse.json({ error: result.error || 'Réponse vide' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    reply: result.reply,
    provider: result.provider,
    model: result.model,
    systemPromptPreview: systemPrompt.slice(0, 200) + '...',
  });
}
