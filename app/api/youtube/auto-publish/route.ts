// AfriLaunch AI — YouTube auto-publish via YouTube Data API v3
// POST /api/youtube/auto-publish { videoId }
//
// This route performs a REAL auto-upload to YouTube via the Data API v3,
// using OAuth 2.0 tokens stored in the user's social-store.
//
// Requirements (admin must configure in /admin):
//   - GOOGLE_CLIENT_ID
//   - GOOGLE_CLIENT_SECRET
//   - YouTube Data API v3 enabled in Google Cloud Console
//
// The user connects their YouTube account via /api/social/connect (OAuth flow),
// and we store their access + refresh tokens in social-store.
//
// Flow:
//   1. Load video + user's YouTube OAuth tokens
//   2. If no tokens → return 400 with instructions to connect YouTube first
//   3. Resumable upload to YouTube Data API v3 (videos.insert)
//   4. On 401 → try to refresh the access token via /token endpoint
//   5. On success → mark video as 'published' + store youtubeUrl
//
// NOTE: This route requires the video file to be stored on our server
// (via /api/youtube/upload) OR an external URL we can fetch.

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getVideo, updateVideo } from '@/lib/youtube-store';
import { getSocialAccounts } from '@/lib/social-store';
import { getFile } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min — YouTube uploads can be slow

interface YouTubeTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Get the user's YouTube OAuth tokens from social-store.
 * Returns null if the user hasn't connected YouTube yet.
 */
async function getUserYouTubeTokens(userId: string): Promise<YouTubeTokens | null> {
  const accounts = await getSocialAccounts(userId);
  const yt = accounts.find((a) => a.platform === 'youtube' && a.connected);
  if (!yt) return null;
  // The tokens are stored in the social account's metadata
  // (set during the OAuth flow in /api/social/connect)
  const tokens = (yt as any).metadata?.tokens as YouTubeTokens | undefined;
  if (!tokens?.accessToken) return null;
  return tokens;
}

/**
 * Refresh the YouTube access token using the refresh token.
 * Returns the new access token (or null on failure).
 */
async function refreshYouTubeToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * Get a valid access token, refreshing if necessary.
 */
async function getValidAccessToken(tokens: YouTubeTokens): Promise<string | null> {
  // If token expires in less than 60s, refresh it
  if (tokens.expiresAt && tokens.expiresAt < Date.now() + 60_000 && tokens.refreshToken) {
    const refreshed = await refreshYouTubeToken(tokens.refreshToken);
    if (refreshed) return refreshed;
    return null;
  }
  return tokens.accessToken;
}

/**
 * Perform a resumable upload to YouTube Data API v3.
 * Returns the YouTube video ID on success.
 */
async function uploadToYouTube(
  accessToken: string,
  videoBuffer: Buffer,
  metadata: { title: string; description: string; tags: string[]; category: string; privacy: string },
): Promise<{ videoId: string; youtubeUrl: string } | { error: string }> {
  // YouTube category IDs (https://developers.google.com/youtube/v3/docs/videoCategories)
  const CATEGORY_IDS: Record<string, string> = {
    'Film & Animation': '1',
    'Autos & Vehicles': '2',
    'Music': '10',
    'Pets & Animals': '15',
    'Sports': '17',
    'Travel & Events': '19',
    'Gaming': '20',
    'People & Blogs': '22',
    'Comedy': '23',
    'Entertainment': '24',
    'News & Politics': '25',
    'Howto & Style': '26',
    'Education': '27',
    'Science & Technology': '28',
    'Nonprofits & Activism': '29',
  };
  const categoryId = CATEGORY_IDS[metadata.category] || '22'; // default People & Blogs

  // Step 1: Initiate resumable session
  const initBody = {
    snippet: {
      title: metadata.title.slice(0, 100),
      description: metadata.description.slice(0, 5000),
      tags: metadata.tags.slice(0, 20),
      categoryId,
    },
    status: {
      privacyStatus: metadata.privacy === 'private' ? 'private' : metadata.privacy === 'unlisted' ? 'unlisted' : 'public',
      selfDeclaredMadeForKids: false,
    },
  };

  let sessionUrl: string;
  try {
    const initRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'video/*',
          'X-Upload-Content-Length': String(videoBuffer.length),
        },
        body: JSON.stringify(initBody),
      },
    );
    if (!initRes.ok) {
      const errText = await initRes.text();
      return { error: `YouTube init failed (${initRes.status}): ${errText.slice(0, 200)}` };
    }
    sessionUrl = initRes.headers.get('location') || '';
    if (!sessionUrl) return { error: 'YouTube n\'a pas renvoyé d\'URL de session' };
  } catch (err) {
    return { error: `YouTube init réseau: ${(err as Error).message}` };
  }

  // Step 2: Upload the video file via the resumable session
  try {
    // Wrap Buffer in a Blob for fetch BodyInit compatibility
    const blob = new Blob([new Uint8Array(videoBuffer)], { type: 'video/*' });
    const uploadRes = await fetch(sessionUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/*',
        'Content-Length': String(videoBuffer.length),
      },
      body: blob,
    });
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return { error: `YouTube upload failed (${uploadRes.status}): ${errText.slice(0, 200)}` };
    }
    const data = await uploadRes.json();
    const videoId = data.id;
    if (!videoId) return { error: 'YouTube n\'a pas renvoyé d\'ID vidéo' };
    return { videoId, youtubeUrl: `https://www.youtube.com/watch?v=${videoId}` };
  } catch (err) {
    return { error: `YouTube upload réseau: ${(err as Error).message}` };
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Non authentifié' }, { status: 401 });
    }

    let body: { videoId?: string };
    try { body = await req.json(); } catch {
      return NextResponse.json({ ok: false, error: 'Body invalide' }, { status: 400 });
    }

    const videoId = body.videoId;
    if (!videoId) {
      return NextResponse.json({ ok: false, error: 'videoId requis' }, { status: 400 });
    }

    const video = await getVideo(videoId);
    if (!video || video.userId !== user.id) {
      return NextResponse.json({ ok: false, error: 'Vidéo introuvable' }, { status: 404 });
    }

    // ─── 1. Check YouTube OAuth is configured ────────────────────────
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({
        ok: false,
        error: 'Publication auto YouTube non configurée. L\'administrateur doit configurer GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET. En attendant, utilisez le bouton "Publier sur YouTube" qui ouvre YouTube Studio avec les champs pré-remplis.',
        fallbackStudioUrl: `https://studio.youtube.com/videos/upload?${new URLSearchParams({
          title: video.title,
          description: video.description,
          tags: video.tags.join(','),
        }).toString()}`,
      }, { status: 503 });
    }

    // ─── 2. Check user has connected their YouTube account ───────────
    const tokens = await getUserYouTubeTokens(user.id);
    if (!tokens) {
      return NextResponse.json({
        ok: false,
        error: 'Vous n\'avez pas connecté votre compte YouTube. Connectez-le dans Réseaux sociaux → YouTube (OAuth Google).',
        connectUrl: '/dashboard/social',
      }, { status: 400 });
    }

    // ─── 3. Get a valid access token (refresh if needed) ─────────────
    const accessToken = await getValidAccessToken(tokens);
    if (!accessToken) {
      return NextResponse.json({
        ok: false,
        error: 'Votre session YouTube a expiré. Reconnectez votre compte dans Réseaux sociaux.',
        connectUrl: '/dashboard/social',
      }, { status: 401 });
    }

    // ─── 4. Load the video file from storage ─────────────────────────
    // The videoUrl can be either:
    //   - `/api/youtube/file?key=...` (file stored on our server)
    //   - An external URL (https://...) — we'd need to fetch it
    let videoBuffer: Buffer;
    if (video.videoUrl.startsWith('/api/youtube/file')) {
      const url = new URL(video.videoUrl, req.url);
      const key = url.searchParams.get('key');
      if (!key) {
        return NextResponse.json({ ok: false, error: 'Clé de fichier vidéo manquante' }, { status: 400 });
      }
      const stored = await getFile(key);
      if (!stored) {
        return NextResponse.json({ ok: false, error: 'Fichier vidéo introuvable sur le serveur' }, { status: 404 });
      }
      videoBuffer = stored.data;
    } else if (video.videoUrl.startsWith('http')) {
      // External URL — fetch it (could be large, so we cap at 500MB)
      try {
        const extRes = await fetch(video.videoUrl);
        if (!extRes.ok) {
          return NextResponse.json({ ok: false, error: `Impossible de télécharger la vidéo: HTTP ${extRes.status}` }, { status: 502 });
        }
        const arrayBuf = await extRes.arrayBuffer();
        videoBuffer = Buffer.from(arrayBuf);
        if (videoBuffer.length > 500 * 1024 * 1024) {
          return NextResponse.json({ ok: false, error: 'Vidéo trop volumineuse (max 500 Mo)' }, { status: 400 });
        }
      } catch (err) {
        return NextResponse.json({ ok: false, error: `Téléchargement vidéo échoué: ${(err as Error).message}` }, { status: 502 });
      }
    } else {
      return NextResponse.json({
        ok: false,
        error: 'URL vidéo non supportée pour la publication auto. Uploadez le fichier via le bouton Importer.',
      }, { status: 400 });
    }

    // ─── 5. Mark as publishing + upload to YouTube ───────────────────
    await updateVideo(videoId, { status: 'publishing', updatedAt: Date.now() });

    const result = await uploadToYouTube(accessToken, videoBuffer, {
      title: video.title,
      description: video.description,
      tags: video.tags,
      category: video.category,
      privacy: video.visibility,
    });

    if ('error' in result) {
      await updateVideo(videoId, { status: 'failed', error: result.error, updatedAt: Date.now() });
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    // ─── 6. Mark as published ────────────────────────────────────────
    await updateVideo(videoId, {
      status: 'published',
      publishedAt: Date.now(),
      youtubeUrl: result.youtubeUrl,
      updatedAt: Date.now(),
    });

    return NextResponse.json({
      ok: true,
      videoId: result.videoId,
      youtubeUrl: result.youtubeUrl,
      message: 'Vidéo publiée automatiquement sur YouTube ✅',
    });
  } catch (err) {
    console.error('[youtube/auto-publish] error:', err);
    return NextResponse.json(
      { ok: false, error: 'Erreur serveur lors de la publication' },
      { status: 500 },
    );
  }
}
