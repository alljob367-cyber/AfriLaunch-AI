// AfriLaunch AI — Agent chat endpoint (streaming SSE for fast perceived UX)
// POST /api/agents/chat { agentId, message }
// → text/event-stream: data: {"chunk":"..."}\n\n  ...  data: {"done":true,"creditsRemaining":N}\n\n
//
// The agent's system prompt is enriched with:
//   1. The user's organization data (name, industry, country, etc.) so the
//      agent speaks in the right context and uses the right brand voice.
//   2. The agent's recent artifacts ("memory" of what it created for this user)
//      so it stays consistent across sessions and doesn't re-do work.
//   3. The list of social platforms the user has connected, so social agents
//      (Content, Ads, Support, Video, Email, E-commerce) know which channels
//      they can publish to.

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { consumeCredits } from '@/lib/user-store';
import { getAgentById } from '@/lib/agents';
import { runAIForPlanFastStream } from '@/lib/ai-runner';
import {
  addMessage, getConversation, getAgentArtifacts, addArtifact, detectArtifact,
} from '@/lib/agents-store';
import { getOrganizationByUserId } from '@/lib/org-store';
import { getSocialAccounts } from '@/lib/social-store';
import type { PlanId } from '@/lib/user-types';

const CREDIT_COST = 1; // cheap: 1 credit per agent message
const MAX_TOKENS = 800; // fast responses (≤2s on free models)
const MAX_HISTORY = 6;  // last 6 messages (3 turns) — keeps prompt small

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Build the enriched system prompt: agent base + org context + memory + social
async function buildEnrichedSystemPrompt(agentId: string, userId: string, basePrompt: string): Promise<string> {
  const parts: string[] = [basePrompt];

  // 1. Organization context
  try {
    const org = await getOrganizationByUserId(userId);
    if (org) {
      parts.push(`

── CONTEXTE DE L'ORGANISATION DE L'UTILISATEUR ──
- Nom du business: ${org.name}
- Industrie/Secteur: ${org.industry || 'non précisée'}
- Pays/Région: ${org.country || 'Afrique'}
- Description: ${org.description || 'non fournie'}
- Email: ${org.email || 'non fourni'}
- Téléphone: ${org.phone || 'non fourni'}
- Site web: ${org.website || 'aucun'}
- Adresse: ${org.address || 'non fournie'}

IMPORTANT: Adapte TOUTES tes réponses à cette organisation. Utilise le nom du business, l'industrie et le pays comme contexte. Propose des solutions concrètes adaptées à ce business précis, pas des réponses génériques.`);
    }
  } catch { /* ignore — org optional */ }

  // 2. Agent memory (artifacts)
  try {
    const artifacts = await getAgentArtifacts(userId, agentId);
    if (artifacts.length > 0) {
      const recent = artifacts.slice(0, 10); // last 10 creations
      const memoryLines = recent.map((a) =>
        `- ${new Date(a.createdAt).toLocaleDateString('fr-FR')}: ${a.title} — ${a.description}`,
      ).join('\n');
      parts.push(`

── MÉMOIRE — CE QUE TU AS DÉJÀ CRUÉ POUR CET UTILISATEUR ──
${memoryLines}

IMPORTANT: Tu as déjà créé ces éléments. Sois cohérent avec ce qui existe déjà. Si l'utilisateur demande quelque chose que tu as déjà fait, propose une amélioration ou une variante plutôt que de tout refaire de zéro. Référence-toi à tes créations précédentes quand c'est pertinent.`);
    }
  } catch { /* ignore */ }

  // 3. Connected social platforms (for social-capable agents)
  try {
    const accounts = await getSocialAccounts(userId);
    const connected = accounts.filter((a) => a.connected);
    if (connected.length > 0) {
      const platformLines = connected.map((a) => `- ${a.platform} (@${a.handle}, ${a.followers || 0} abonnés)`).join('\n');
      parts.push(`

── RÉSEAUX SOCIAUX CONNECTÉS PAR L'UTILISATEUR ──
${platformLines}

Si l'utilisateur te demande de publier, planifier ou répondre sur les réseaux, indique clairement sur quelle plateforme tu proposes d'agir. Pour publier réellement, l'utilisateur devra utiliser le module "Réseaux sociaux" ou "Contenu" du dashboard. Tu peux préparer le contenu, suggérer la plateforme idéale, et proposer une légende + hashtags + CTA prêts à publier.`);
    } else {
      // No social connected — only mention for social agents
      const socialAgentIds = ['content', 'ads', 'support', 'video', 'email', 'ecommerce'];
      if (socialAgentIds.includes(agentId)) {
        parts.push(`

── RÉSEAUX SOCIAUX ──
L'utilisateur n'a encore connecté aucun réseau social. Si ta tâche implique de publier ou répondre sur les réseaux, propose-lui d'aller dans le module "Réseaux sociaux" du dashboard pour connecter Instagram, Facebook, WhatsApp, LinkedIn ou X avant de publier.`);
      }
    }
  } catch { /* ignore */ }

  return parts.join('\n');
}

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
      insufficientCredits: !consumed.dailyLimit && !consumed.paymentRequired,
      dailyLimitReached: !!consumed.dailyLimit,
      paymentRequired: !!consumed.paymentRequired,
    }, { status: consumed.paymentRequired ? 402 : 402 });
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

  // Build the enriched system prompt (org + memory + social context)
  const enrichedSystemPrompt = await buildEnrichedSystemPrompt(agentId, userId, agent.systemPrompt);

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
          systemPrompt: enrichedSystemPrompt,
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

              // Heuristic: detect if this message describes a creation
              // and store it as an artifact for future memory.
              try {
                const detected = detectArtifact(agentId, fullReply);
                if (detected) {
                  await addArtifact(userId, agentId, detected.title, detected.description, detected.tags);
                  // Notify the client that an artifact was saved
                  send({ type: 'artifact', artifact: detected });
                }
              } catch { /* ignore — artifact save is best-effort */ }
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
            try {
              const detected = detectArtifact(agentId, fullReply);
              if (detected) {
                await addArtifact(userId, agentId, detected.title, detected.description, detected.tags);
                send({ type: 'artifact', artifact: detected });
              }
            } catch { /* ignore */ }
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
