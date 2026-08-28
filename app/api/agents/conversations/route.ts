// AfriLaunch AI — List user's agent conversations
// GET /api/agents/conversations → { ok, conversations: [{ agentId, lastMessage, updatedAt, messageCount }] }

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getUserConversations } from '@/lib/agents-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const conversations = await getUserConversations(user.id);

  return NextResponse.json({
    ok: true,
    conversations: conversations.map((c) => ({
      agentId: c.agentId,
      messageCount: c.messages.length,
      lastMessage: c.messages[c.messages.length - 1]?.content?.slice(0, 120) ?? '',
      lastRole: c.messages[c.messages.length - 1]?.role ?? null,
      updatedAt: c.updatedAt,
    })),
  });
}
