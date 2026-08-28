// AfriLaunch AI — ElevenLabs agents CRUD
// GET  /api/whatsapp-agent/agents — list agents
// POST /api/whatsapp-agent/agents — create agent { name, systemPrompt, firstMessage }

import { NextRequest, NextResponse } from 'next/server';
import { validateSession, updateConfig, getConfig } from '@/lib/config-store';
import { createElevenLabsAgent, listElevenLabsAgents, deleteElevenLabsAgent } from '@/lib/elevenlabs-agent';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

export async function GET(req: NextRequest) {
  const ok = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const result = await listElevenLabsAgents();
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const ok = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { name?: string; systemPrompt?: string; firstMessage?: string; voiceId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  if (!body.name || !body.systemPrompt) {
    return NextResponse.json({ error: 'Nom et prompt système requis' }, { status: 400 });
  }

  const config = await getConfig();
  const result = await createElevenLabsAgent({
    name: body.name,
    systemPrompt: body.systemPrompt,
    voiceId: body.voiceId || config.elevenlabs.voiceId,
    firstMessage: body.firstMessage || 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
  });

  if (result.ok && result.agent) {
    // Save the agent ID in config
    await updateConfig({
      twilio: { ...config.twilio, elevenLabsAgentId: result.agent.agent_id },
    });
  }

  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const ok = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const url = new URL(req.url);
  const agentId = url.searchParams.get('agentId');
  if (!agentId) return NextResponse.json({ error: 'agentId requis' }, { status: 400 });

  const result = await deleteElevenLabsAgent(agentId);
  return NextResponse.json(result);
}
