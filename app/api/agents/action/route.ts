// AfriLaunch AI — Agent action endpoint
// POST /api/agents/action { action, agentId, ...payload }
//
// Lets the agent chat trigger real side-effects:
//   - { action: 'publish_social', platform, content } → publish to social network
//   - { action: 'reply_social', platform, recipientHandle, content } → reply on social
//   - { action: 'save_artifact', title, description, tags } → save to agent memory
//
// This bridges the gap between "agent talks about doing X" and "agent actually does X".
// The agent itself doesn't call this endpoint — the dashboard UI exposes buttons
// when the agent's reply contains a publishable artifact, and the user clicks
// to confirm the action.

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { addArtifact } from '@/lib/agents-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { action?: string; agentId?: string; [key: string]: any };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const action = body.action;
  const agentId = body.agentId;
  if (!action || !agentId) {
    return NextResponse.json({ error: 'action et agentId requis' }, { status: 400 });
  }

  // ─── save_artifact: explicit memory save ────────────────────────────
  if (action === 'save_artifact') {
    const title = (body.title || '').trim();
    const description = (body.description || '').trim();
    if (!title || !description) {
      return NextResponse.json({ error: 'title et description requis' }, { status: 400 });
    }
    const tags = Array.isArray(body.tags) ? body.tags : [];
    const artifact = await addArtifact(user.id, agentId, title, description, tags);
    return NextResponse.json({ ok: true, artifact });
  }

  // ─── publish_social: proxy to /api/social/publish ──────────────────
  // We don't redirect — we re-implement the call internally so the user
  // gets one unified response with the agent context attached.
  if (action === 'publish_social') {
    const platform = body.platform;
    const content = (body.content || '').trim();
    if (!platform || !content) {
      return NextResponse.json({ error: 'platform et content requis' }, { status: 400 });
    }

    // Internal call to the publish endpoint — same user, same session
    const baseUrl = new URL(req.url).origin;
    const cookie = req.headers.get('cookie') || '';
    const res = await fetch(`${baseUrl}/api/social/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie,
      },
      body: JSON.stringify({ platform, content, imageUrl: body.imageUrl }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  // ─── reply_social: send a message to a specific handle ─────────────
  // For now this is the same as publish_social but with a 'recipientHandle'
  // field — most platforms don't have a programmatic reply-to-user API
  // without OAuth, so we return a deep link the user can click.
  if (action === 'reply_social') {
    const platform = body.platform;
    const content = (body.content || '').trim();
    const recipientHandle = (body.recipientHandle || '').trim().replace(/^@/, '');
    if (!platform || !content) {
      return NextResponse.json({ error: 'platform et content requis' }, { status: 400 });
    }

    // Generate a deep link for the reply
    let replyUrl = '';
    if (platform === 'whatsapp') {
      const phone = recipientHandle.replace(/[^0-9]/g, '');
      replyUrl = `https://wa.me/${phone}?text=${encodeURIComponent(content)}`;
    } else if (platform === 'twitter') {
      replyUrl = `https://x.com/intent/tweet?in_reply_to=${encodeURIComponent(recipientHandle)}&text=${encodeURIComponent(content)}`;
    } else if (platform === 'facebook') {
      replyUrl = `https://messenger.com/t/${encodeURIComponent(recipientHandle)}`;
    } else if (platform === 'instagram') {
      replyUrl = `https://instagram.com/direct/new/?text=${encodeURIComponent(content)}`;
    } else if (platform === 'linkedin') {
      replyUrl = `https://linkedin.com/messaging`;
    } else {
      return NextResponse.json({ error: 'Plateforme non supportée pour reply' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      replyUrl,
      message: 'Cliquez sur le lien pour ouvrir la conversation et envoyer votre réponse.',
    });
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
