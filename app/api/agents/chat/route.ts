// AfriLaunch AI — Agent chat endpoint (streaming SSE for fast perceived UX)
// POST /api/agents/chat { agentId, message }
// → text/event-stream: data: {"chunk":"..."}\n\n  ...  data: {"done":true,"creditsRemaining":N}\n\n
//
// Fallback: if the body cannot be parsed or the user is not authed, returns
// a regular JSON error (not SSE) so the client can branch on Content-Type.

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { consumeCredits } from '@/lib/user-store';
import { getAgentById } from '@/lib/agents';
import { runAIForPlanFastStream } from '@/lib/ai-runner';
import { addMessage, getConversation } from '@/lib/agents-store';
import type { PlanId } from '@/lib/user-types';

const CREDIT_COST = 1; // cheap: 1 credit per agent message
const MAX_TOKENS = 800; // fast responses (≤2s on free models)
const MAX_HISTORY = 6;  // last 6 messages (3 turns) — keeps prompt small

export const runtime = 'nodejs';
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

  // Consume 1 credit up front (admin bypass inside consumeCredits)
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

  const userId = user.id;
  const plan = user.plan as PlanId;
  const creditsRemainingAfterConsume = consumed.user?.credits;

  // Build the SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullReply = '';
      let didError = false;

      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller might be closed already
        }
      };

      try {
        const gen = runAIForPlanFastStream({
          systemPrompt: agent.systemPrompt,
          userMessage: message,
          history,
          maxTokens: MAX_TOKENS,
        }, plan);

        let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;
        let sawFirstChunk = false;

        for await (const evt of gen) {
          if (evt.chunk) {
            if (!sawFirstChunk) {
              // Signal "stream started" so client can hide the typing indicator
              send({ type: 'start' });
              sawFirstChunk = true;
            }
            fullReply += evt.chunk;
            send({ type: 'chunk', chunk: evt.chunk });
          } else if (evt.usage) {
            usage = evt.usage;
          } else if (evt.error) {
            didError = true;
            // Refund on failure
            await consumeCredits(userId, -CREDIT_COST);
            send({ type: 'error', error: evt.error });
            controller.close();
            return;
          } else if (evt.done) {
            // Persist the assistant reply (only if we got at least one chunk)
            if (fullReply.length > 0) {
              await addMessage(userId, agentId, 'assistant', fullReply);
            }
            send({
              type: 'done',
              creditsRemaining: creditsRemainingAfterConsume,
              usage,
              fullReplyLength: fullReply.length,
            });
            controller.close();
            return;
          }
        }

        // Generator ended without explicit done event — finalize
        if (!didError) {
          if (fullReply.length > 0) {
            await addMessage(userId, agentId, 'assistant', fullReply);
          }
          send({ type: 'done', creditsRemaining: creditsRemainingAfterConsume, usage });
        }
      } catch (err) {
        didError = true;
        await consumeCredits(userId, -CREDIT_COST);
        send({ type: 'error', error: (err as Error).message });
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform, must-revalidate',
      'Connection': 'keep-alive',
      // Disable Nginx/Vercel buffering so chunks flush immediately
      'X-Accel-Buffering': 'no',
      // Helpful for client debugging
      'X-Stream-Protocol': 'afrilaunch-agents-v1',
    },
  });
}
