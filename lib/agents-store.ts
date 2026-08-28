// AfriLaunch AI — Agents conversations store
// Persists per-user, per-agent chat history in Supabase KV.
// Keeps only the last 20 messages per conversation to stay fast & cheap.

import { kvGet, kvSet } from './db';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number; // epoch ms
}

export interface Conversation {
  userId: string;
  agentId: string;
  messages: ChatMessage[];
  updatedAt: number;
}

interface ConversationsStore {
  conversations: Conversation[];
}

const KEY = 'agent-conversations';
const MAX_MESSAGES = 20; // per conversation

async function readStore(): Promise<ConversationsStore> {
  const s = await kvGet<ConversationsStore>(KEY);
  return s ?? { conversations: [] };
}

async function writeStore(s: ConversationsStore): Promise<void> {
  // Trim: keep only the latest 200 conversations globally (LRU by updatedAt)
  if (s.conversations.length > 200) {
    s.conversations.sort((a, b) => b.updatedAt - a.updatedAt);
    s.conversations = s.conversations.slice(0, 200);
  }
  await kvSet(KEY, s);
}

function genId(): string {
  // Lightweight ID generator (avoid pulling crypto in hot path)
  return 'msg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function getConversation(userId: string, agentId: string): Promise<Conversation | null> {
  const s = await readStore();
  return s.conversations.find((c) => c.userId === userId && c.agentId === agentId) ?? null;
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const s = await readStore();
  return s.conversations
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function addMessage(
  userId: string,
  agentId: string,
  role: ChatRole,
  content: string,
): Promise<Conversation> {
  const s = await readStore();
  let conv = s.conversations.find((c) => c.userId === userId && c.agentId === agentId);
  const now = Date.now();
  const msg: ChatMessage = { id: genId(), role, content, createdAt: now };

  if (!conv) {
    conv = { userId, agentId, messages: [msg], updatedAt: now };
    s.conversations.push(conv);
  } else {
    conv.messages.push(msg);
    // Trim to last MAX_MESSAGES
    if (conv.messages.length > MAX_MESSAGES) {
      conv.messages = conv.messages.slice(-MAX_MESSAGES);
    }
    conv.updatedAt = now;
  }

  await writeStore(s);
  return conv;
}

export async function clearConversation(userId: string, agentId: string): Promise<void> {
  const s = await readStore();
  s.conversations = s.conversations.filter(
    (c) => !(c.userId === userId && c.agentId === agentId),
  );
  await writeStore(s);
}
