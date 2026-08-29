// AfriLaunch AI — YouTube videos CRUD
// GET  /api/youtube/videos → list user's videos
// POST /api/youtube/videos → create a new video post

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getUserVideos, createVideo, type VideoPost } from '@/lib/youtube-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const videos = await getUserVideos(user.id);
  return NextResponse.json({ ok: true, videos });
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const required = ['title', 'description', 'videoUrl'];
  for (const f of required) {
    if (!body[f]) return NextResponse.json({ error: `${f} requis` }, { status: 400 });
  }

  const video = await createVideo({
    userId: user.id,
    title: String(body.title).slice(0, 100),
    description: String(body.description).slice(0, 5000),
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 20) : [],
    category: body.category || 'People & Blogs',
    visibility: body.visibility || 'public',
    videoUrl: String(body.videoUrl),
    thumbnailPrompt: body.thumbnailPrompt,
    thumbnailUrl: body.thumbnailUrl,
    scheduledAt: body.scheduledAt ? Number(body.scheduledAt) : null,
    status: body.scheduledAt ? 'scheduled' : 'draft',
  });

  return NextResponse.json({ ok: true, video });
}
