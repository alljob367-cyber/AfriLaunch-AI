// AfriLaunch AI — YouTube publish (manual trigger)
// POST /api/youtube/publish { videoId }
// → marks video as 'publishing' + returns YouTube Studio upload URL pre-filled
//
// Real auto-upload via YouTube Data API v3 requires OAuth 2.0 per user.
// Phase 1: we prepare everything and the user clicks 1 link to finalize
// the upload on YouTube Studio with title/description/tags pre-filled.

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getVideo, updateVideo } from '@/lib/youtube-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { videoId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const videoId = body.videoId;
  if (!videoId) return NextResponse.json({ error: 'videoId requis' }, { status: 400 });

  const video = await getVideo(videoId);
  if (!video || video.userId !== user.id) {
    return NextResponse.json({ error: 'Vidéo introuvable' }, { status: 404 });
  }

  // Build YouTube Studio upload URL with pre-filled metadata
  // YouTube Studio supports URL params for the upload form
  const params = new URLSearchParams({
    title: video.title,
    description: video.description,
    tags: video.tags.join(','),
  });
  if (video.category) params.set('category', video.category);
  const studioUrl = `https://studio.youtube.com/videos/upload?${params.toString()}`;

  // Mark as publishing
  await updateVideo(videoId, {
    status: 'publishing',
    updatedAt: Date.now(),
  });

  return NextResponse.json({
    ok: true,
    studioUrl,
    videoUrl: video.videoUrl,
    message: 'Cliquez sur le lien pour ouvrir YouTube Studio avec votre vidéo pré-remplie. Uploadez votre fichier vidéo, vérifiez les champs, puis publiez.',
  });
}
