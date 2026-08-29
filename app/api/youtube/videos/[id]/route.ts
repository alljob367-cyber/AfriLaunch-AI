// AfriLaunch AI — YouTube video CRUD by ID
// GET    /api/youtube/videos/[id] → get one video
// PATCH  /api/youtube/videos/[id] → update (e.g. schedule, status)
// DELETE /api/youtube/videos/[id] → delete

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getVideo, updateVideo, deleteVideo } from '@/lib/youtube-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { id } = await params;
  const video = await getVideo(id);
  if (!video || video.userId !== user.id) {
    return NextResponse.json({ error: 'Vidéo introuvable' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, video });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { id } = await params;
  const video = await getVideo(id);
  if (!video || video.userId !== user.id) {
    return NextResponse.json({ error: 'Vidéo introuvable' }, { status: 404 });
  }

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const updates: any = {};
  const allowed = ['title', 'description', 'tags', 'category', 'visibility', 'videoUrl', 'thumbnailPrompt', 'thumbnailUrl', 'scheduledAt', 'status', 'youtubeUrl', 'error'];
  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = body[k];
  }

  // If scheduledAt is set, status becomes 'scheduled' (unless already published)
  if (updates.scheduledAt !== undefined && video.status !== 'published') {
    updates.status = updates.scheduledAt ? 'scheduled' : 'draft';
  }

  const updated = await updateVideo(id, updates);
  return NextResponse.json({ ok: true, video: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { id } = await params;
  const ok = await deleteVideo(user.id, id);
  if (!ok) return NextResponse.json({ error: 'Vidéo introuvable' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
