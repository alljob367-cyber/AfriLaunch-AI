// AfriLaunch AI — Agent chat endpoint (fast, persisted history)
// POST /api/agents/chat { agentId, message }
// → { ok, reply, provider, model, creditsRemaining }

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { consumeCredits } from '@/lib/user-store';
import { getAgentById } from '@/lib/agents';
import { runAIForPlanFast } from '@/lib/ai-runner';
import { addMessage, getConversation } from '@/lib/agents-store';
import type { PlanId } from '@/lib/user-types';

const CREDIT_COST = 1; // cheap: 1 credit per agent message
const MAX_TOKENS = 800; // fast responses (≤2s on free models)
const MAX_HISTORY = 6;  // last 6 messages (3 turns) — keeps prompt small

export const runtime = 'nodejs';
// Always dynamic — user-specific chat
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { agentId?: string; message?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const agentId = (body.agentId || '').trim();
  const message = (body.message || '').trim();
  if (!agentId || !message) {
    return NextResponse.json({ error: 'agentId et message requis' }, { status: 400 });
  }

  const agent = getAgentById(agentId);
  if (!agent) {
    return NextResponse.json({ error: 'Agent inconnu' }, { status: 404 });
  }

  // Consume 1 credit (admin bypass inside consumeCredits)
  const consumed = await consumeCredits(user.id, CREDIT_COST);
  if (!consumed.ok) {
    return NextResponse.json({
      ok: false,
      error: consumed.error,
      insufficientCredits: !consumed.dailyLimit,
      dailyLimitReached: !!consumed.dailyLimit,
    }, { status: 402 });
  }

  // Load conversation history (last N messages) for context
  const conv = await getConversation(user.id, agentId);
  const history = (conv?.messages ?? [])
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content }) as
      { role: 'user' | 'assistant'; content: string });

  // Save user message immediately (so it persists even if AI call fails)
  await addMessage(user.id, agentId, 'user', message);

  const result = await runAIForPlanFast({
    systemPrompt: agent.systemPrompt,
    userMessage: message,
    history,
    maxTokens: MAX_TOKENS,
  }, user.plan as PlanId);

  if (!result.ok || !result.reply) {
    // Refund on failure
    await consumeCredits(user.id, -CREDIT_COST);
    return NextResponse.json({
      ok: false,
      error: result.error || 'Réponse vide',
    }, { status: 500 });
  }

  // Save assistant reply
  await addMessage(user.id, agentId, 'assistant', result.reply);

  return NextResponse.json({
    ok: true,
    reply: result.reply,
    provider: result.provider,
    model: result.model,
    creditsUsed: CREDIT_COST,
    creditsRemaining: consumed.user?.credits,
  });
}
