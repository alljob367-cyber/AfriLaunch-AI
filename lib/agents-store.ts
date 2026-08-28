// AfriLaunch AI — Agents conversations store
// Persists per-user, per-agent chat history in Supabase KV.
// Keeps only the last 20 messages per conversation to stay fast & cheap.
//
// Also stores "artifacts" — things each agent has created for the user
// (e.g. "Branding Agent created a logo for Hotel Albermon on 2025-08-28").
// Artifacts are passed back to the agent as context so it can remember
// what it has already done and stay consistent across sessions.

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

// An artifact = a thing an agent created for the user.
// Stored compactly (just a description + tags) so we can inject it into
// the system prompt without bloating it.
export interface AgentArtifact {
  id: string;
  userId: string;
  agentId: string;
  // Short title (e.g. "Logo Hotel Albermon")
  title: string;
  // 1-2 sentence description of what was created
  description: string;
  // Tags for filtering (e.g. ['logo', 'branding', 'hotel'])
  tags: string[];
  createdAt: number;
}

interface ConversationsStore {
  conversations: Conversation[];
}

interface ArtifactsStore {
  artifacts: AgentArtifact[];
}

const KEY = 'agent-conversations';
const ARTIFACTS_KEY = 'agent-artifacts';
const MAX_MESSAGES = 20;       // per conversation
const MAX_ARTIFACTS_PER_USER = 50; // per user (LRU)

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

async function readArtifacts(): Promise<ArtifactsStore> {
  const s = await kvGet<ArtifactsStore>(ARTIFACTS_KEY);
  return s ?? { artifacts: [] };
}

async function writeArtifacts(s: ArtifactsStore): Promise<void> {
  await kvSet(ARTIFACTS_KEY, s);
}

function genId(): string {
  // Lightweight ID generator (avoid pulling crypto in hot path)
  return 'msg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function genArtifactId(): string {
  return 'art_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
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

// ─── Artifacts API ────────────────────────────────────────────────────

export async function getUserArtifacts(userId: string): Promise<AgentArtifact[]> {
  const s = await readArtifacts();
  return s.artifacts
    .filter((a) => a.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAgentArtifacts(userId: string, agentId: string): Promise<AgentArtifact[]> {
  const s = await readArtifacts();
  return s.artifacts
    .filter((a) => a.userId === userId && a.agentId === agentId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function addArtifact(
  userId: string,
  agentId: string,
  title: string,
  description: string,
  tags: string[] = [],
): Promise<AgentArtifact> {
  const s = await readArtifacts();
  const artifact: AgentArtifact = {
    id: genArtifactId(),
    userId, agentId,
    title: title.slice(0, 120),
    description: description.slice(0, 400),
    tags: tags.slice(0, 10),
    createdAt: Date.now(),
  };
  s.artifacts.push(artifact);

  // LRU: cap per user
  const userArtifacts = s.artifacts
    .filter((a) => a.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
  if (userArtifacts.length > MAX_ARTIFACTS_PER_USER) {
    const toRemove = userArtifacts.slice(MAX_ARTIFACTS_PER_USER);
    const removeIds = new Set(toRemove.map((a) => a.id));
    s.artifacts = s.artifacts.filter((a) => !removeIds.has(a.id));
  }

  await writeArtifacts(s);
  return artifact;
}

// Heuristic: detect if an assistant message describes a creation
// (e.g. "Voici votre logo", "J'ai créé un post Instagram", "Voici la charte")
// Returns a parsed artifact if detected, or null.
export function detectArtifact(agentId: string, message: string): { title: string; description: string; tags: string[] } | null {
  const lower = message.toLowerCase();
  // Match patterns like "voici votre X", "j'ai créé votre X", "voici le X"
  const patterns = [
    /voici (?:votre|le|la|un|une) ([a-zàâäéèêëïîôöùûüÿç\s-]{3,50})/i,
    /j['’]ai créé (?:votre|le|la|un|une) ([a-zàâäéèêëïîôöùûüÿç\s-]{3,50})/i,
    /j['’]ai généré (?:votre|le|la|un|une) ([a-zàâäéèêëïîôöùûüÿç\s-]{3,50})/i,
    /voici la proposition de ([a-zàâäéèêëïîôöùûüÿç\s-]{3,50})/i,
  ];
  for (const p of patterns) {
    const m = message.match(p);
    if (m) {
      const what = m[1].trim().replace(/\s+/g, ' ');
      const title = `${what.charAt(0).toUpperCase()}${what.slice(1)}`;
      const description = message.slice(0, 300).replace(/\n+/g, ' ').trim() + '...';
      const tags = [agentId, what.split(' ')[0]].filter(Boolean);
      return { title, description, tags };
    }
  }
  return null;
}

