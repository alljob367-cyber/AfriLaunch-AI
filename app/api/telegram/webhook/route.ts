// AfriLaunch AI — Telegram webhook endpoint
// POST /api/telegram/webhook — receives messages from Telegram, routes to agent, responds
// The webhook URL is: https://your-app.com/api/telegram/webhook

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { AGENTS, getAgentByCommand, routeMessage, getAgentsListText } from '@/lib/agents';
import { runAIForPlan } from '@/lib/ai-runner';
import { getUserByTelegramId, consumeCredits, PLANS } from '@/lib/user-store';

interface TelegramMessage {
  message_id: number;
  from?: { id: number; first_name: string; username?: string };
  chat: { id: number; type: string; first_name?: string; title?: string };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

// In-memory conversation history per chat (resets on server restart)
// In production, use Redis or a database.
const conversationHistory = new Map<number, Array<{ role: 'user' | 'assistant'; content: string }>>();
const MAX_HISTORY = 10; // keep last 10 messages per chat

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');

  const config = await getConfig();

  // Verify webhook secret
  if (!config.telegram.enabled) {
    return NextResponse.json({ error: 'Telegram bot disabled' }, { status: 403 });
  }
  if (config.telegram.webhookSecret && secret !== config.telegram.webhookSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
  }
  if (!config.telegram.botToken) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const msg = update.message || update.edited_message;
  if (!msg || !msg.text) {
    return NextResponse.json({ ok: true }); // ignore non-text messages
  }

  // Check allowed users
  if (config.telegram.allowedUserIds.length > 0 && msg.from) {
    if (!config.telegram.allowedUserIds.includes(msg.from.id)) {
      return NextResponse.json({ ok: true }); // silently ignore
    }
  }

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const userName = msg.from?.first_name ?? 'utilisateur';

  // Handle /commands
  if (text.startsWith('/')) {
    const parts = text.split(/\s+/);
    const command = parts[0].toLowerCase().replace(/^\//, '').split('@')[0]; // strip @botname
    const rest = parts.slice(1).join(' ').trim();

    // /start or /help — welcome message
    if (command === 'start' || command === 'help') {
      await sendTelegramMessage(config.telegram.botToken, chatId, config.telegram.welcomeMessage);
      return NextResponse.json({ ok: true });
    }

    // /agents — list all agents
    if (command === 'agents' || command === 'list') {
      await sendTelegramMessage(config.telegram.botToken, chatId, getAgentsListText(), true);
      return NextResponse.json({ ok: true });
    }

    // Agent-specific command (e.g. /branding, /content, etc.)
    const agent = getAgentByCommand(command);
    if (agent) {
      if (!rest) {
        // No message after command — show agent description
        await sendTelegramMessage(
          config.telegram.botToken,
          chatId,
          `🤖 *${agent.name}* (${agent.role})\n\n${agent.description}\n\nEnvoyez votre message après la commande :\n/${agent.command} votre question ici`,
          true,
        );
        return NextResponse.json({ ok: true });
      }
      // Process with this specific agent
      await processWithAgent(agent.id, rest, chatId, userName, config, msg.from?.id);
      return NextResponse.json({ ok: true });
    }

    // Unknown command
    await sendTelegramMessage(
      config.telegram.botToken,
      chatId,
      `❓ Commande inconnue: /${command}\n\nTapez /help pour voir les commandes disponibles.`,
    );
    return NextResponse.json({ ok: true });
  }

  // No /command — route automatically based on keywords or use default agent
  const routedAgent = routeMessage(text);
  const agentId = routedAgent.id !== config.telegram.defaultAgent
    ? routedAgent.id
    : config.telegram.defaultAgent;
  await processWithAgent(agentId, text, chatId, userName, config, msg.from?.id);
  return NextResponse.json({ ok: true });
}

async function processWithAgent(
  agentId: string,
  userMessage: string,
  chatId: number,
  userName: string,
  config: Awaited<ReturnType<typeof getConfig>>,
  telegramUserId?: number,
) {
  const agent = AGENTS.find((a) => a.id === agentId);
  if (!agent) {
    await sendTelegramMessage(config.telegram.botToken, chatId, '❌ Agent introuvable.');
    return;
  }

  // ─── Authentication & credits check ─────────────────────────────────
  // Every user must have an AfriLaunch account linked to their Telegram ID.
  // If not linked → instruct them to register on the website.
  // If linked but no credits → instruct them to upgrade/recharge.
  if (telegramUserId) {
    const user = await getUserByTelegramId(telegramUserId);
    if (!user) {
      await sendTelegramMessage(
        config.telegram.botToken,
        chatId,
        `🔒 *Compte requis*\n\nBonjour ${userName} ! Pour utiliser les agents IA, vous devez créer un compte gratuit sur AfriLaunch AI.\n\n👉 Inscrivez-vous ici : ${config.appUrl}/register\n\nVous recevrez *50 crédits offerts* à l'inscription, puis pourrez lier votre compte Telegram dans votre dashboard.`,
        true,
      );
      return;
    }

    // Check plan status
    if (user.planStatus !== 'active') {
      await sendTelegramMessage(
        config.telegram.botToken,
        chatId,
        `⚠️ *Abonnement inactif*\n\nVotre abonnement ${PLANS[user.plan].name} n'est plus actif.\n\n👉 Réactivez-le : ${config.appUrl}/dashboard/subscription`,
        true,
      );
      return;
    }

    // Consume 1 credit per message (Enterprise is unlimited)
    if (PLANS[user.plan].creditsPerMonth !== -1) {
      const consumed = await consumeCredits(user.id, 1);
      if (!consumed.ok) {
        await sendTelegramMessage(
          config.telegram.botToken,
          chatId,
          `💎 *Crédits insuffisants*\n\nIl vous reste *${user.credits} crédit(s)*. Pour continuer à utiliser les agents IA :\n\n• Rechargez vos crédits : ${config.appUrl}/dashboard/subscription\n• Passez à un plan supérieur : ${config.appUrl}/dashboard/subscription\n\n💡 Astuce : Parrainez vos amis et gagnez 100 crédits par filleul ! ${config.appUrl}/dashboard/referral`,
          true,
        );
        return;
      }
    }
  }

  // Send "typing" indicator
  await sendChatAction(config.telegram.botToken, chatId, 'typing');

  // Get conversation history
  const history = conversationHistory.get(chatId) ?? [];

  // Call AI
  // Get the user's plan (we have `user` from the auth check above)
  const linkedUser = telegramUserId ? await getUserByTelegramId(telegramUserId) : null;
  const userPlan = linkedUser?.plan || 'free';

  const result = await runAIForPlan({
    systemPrompt: `${agent.systemPrompt}\n\nContexte: Tu discutes avec ${userName} via Telegram. Sois concis (max 4000 caractères car limite Telegram). Utilise le formatage Markdown quand pertinent (gras, listes).`,
    userMessage,
    history,
    maxTokens: 2000,
  }, userPlan);

  if (!result.ok || !result.reply) {
    await sendTelegramMessage(
      config.telegram.botToken,
      chatId,
      `❌ Désolé, une erreur est survenue avec ${agent.name}.\n\nErreur: ${result.error}\n\nVérifiez la configuration IA dans /admin/ai`,
    );
    return;
  }

  // Send the reply (append credit info footer for non-enterprise users)
  let footer = '';
  if (telegramUserId) {
    const updatedUser = await getUserByTelegramId(telegramUserId);
    if (updatedUser && PLANS[updatedUser.plan].creditsPerMonth !== -1) {
      footer = `\n\n---\n💎 ${updatedUser.credits} crédits restants · /help`;
    }
  }
  await sendTelegramMessage(config.telegram.botToken, chatId, result.reply + footer, true);

  // Update conversation history
  const newHistory = [
    ...history,
    { role: 'user' as const, content: userMessage },
    { role: 'assistant' as const, content: result.reply },
  ].slice(-MAX_HISTORY);
  conversationHistory.set(chatId, newHistory);
}

// ─── Telegram API helpers ─────────────────────────────────────────────
async function sendTelegramMessage(token: string, chatId: number, text: string, parseMarkdown = false) {
  // Telegram message limit is 4096 chars — split if needed
  const chunks = splitMessage(text, 4000);
  for (const chunk of chunks) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          parse_mode: parseMarkdown ? 'Markdown' : undefined,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      // If Markdown fails, retry without parse_mode
      if (parseMarkdown) {
        try {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: chunk, disable_web_page_preview: true }),
            signal: AbortSignal.timeout(15000),
          });
        } catch { /* give up */ }
      }
    }
    // Small delay between chunks to avoid rate limiting
    if (chunks.length > 1) await new Promise((r) => setTimeout(r, 200));
  }
}

async function sendChatAction(token: string, chatId: number, action: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action }),
      signal: AbortSignal.timeout(5000),
    });
  } catch { /* ignore */ }
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    // Try to split at last newline before maxLen
    let splitAt = remaining.lastIndexOf('\n', maxLen);
    if (splitAt < maxLen * 0.5) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}
