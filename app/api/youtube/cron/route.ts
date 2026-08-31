// AfriLaunch AI — YouTube cron (auto-publish scheduled videos)
// GET /api/youtube/cron?key=CRON_SECRET
//
// Called by Vercel Cron (or external cron like cron-job.org) every hour.
// Finds videos due now + auto-schedulable drafts based on user calendars.
// For each due video:
//   1. Marks status as 'publishing'
//   2. If GOOGLE_CLIENT_ID is set + user has YouTube OAuth tokens
//      → REAL auto-upload via YouTube Data API v3 (videos.insert)
//   3. Otherwise → fallback to email notification with YouTube Studio URL
//
// The CRON_SECRET prevents unauthorized calls. Set it in Vercel env vars.

import { NextRequest, NextResponse } from 'next/server';
import { getVideosDueNow, getAutoSchedulableVideos, updateVideo, getUserSchedule } from '@/lib/youtube-store';
import { sendEmail } from '@/lib/email-sender';
import { getConfig } from '@/lib/config-store';
import { kvGet, getFile } from '@/lib/db';
import { getSocialAccounts } from '@/lib/social-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min — YouTube uploads can be slow

interface YouTubeTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

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

async function getUserYouTubeTokens(userId: string): Promise<YouTubeTokens | null> {
  const accounts = await getSocialAccounts(userId);
  const yt = accounts.find((a) => a.platform === 'youtube' && a.connected);
  if (!yt) return null;
  const tokens = (yt as any).metadata?.tokens as YouTubeTokens | undefined;
  if (!tokens?.accessToken) return null;
  return tokens;
}

async function getValidAccessToken(tokens: YouTubeTokens): Promise<string | null> {
  if (tokens.expiresAt && tokens.expiresAt < Date.now() + 60_000 && tokens.refreshToken) {
    return await refreshYouTubeToken(tokens.refreshToken);
  }
  return tokens.accessToken;
}

async function uploadToYouTube(
  accessToken: string,
  videoBuffer: Buffer,
  metadata: { title: string; description: string; tags: string[]; category: string; privacy: string },
): Promise<{ videoId: string; youtubeUrl: string } | { error: string }> {
  const CATEGORY_IDS: Record<string, string> = {
    'People & Blogs': '22', 'Music': '10', 'Education': '27', 'Science & Technology': '28',
    'Comedy': '23', 'Entertainment': '24', 'Howto & Style': '26', 'Sports': '17',
    'Gaming': '20', 'Travel & Events': '19', 'News & Politics': '25', 'Film & Animation': '1',
  };
  const initBody = {
    snippet: {
      title: metadata.title.slice(0, 100),
      description: metadata.description.slice(0, 5000),
      tags: metadata.tags.slice(0, 20),
      categoryId: CATEGORY_IDS[metadata.category] || '22',
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

  try {
    // Wrap Buffer in a Blob for fetch BodyInit compatibility
    const blob = new Blob([new Uint8Array(videoBuffer)], { type: 'video/*' });
    const uploadRes = await fetch(sessionUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'video/*', 'Content-Length': String(videoBuffer.length) },
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

async function tryAutoPublish(video: any): Promise<{ ok: boolean; youtubeUrl?: string; error?: string }> {
  // 1. Check OAuth configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return { ok: false, error: 'OAuth Google non configuré' };
  }

  // 2. Get user tokens
  const tokens = await getUserYouTubeTokens(video.userId);
  if (!tokens) return { ok: false, error: 'YouTube non connecté' };

  const accessToken = await getValidAccessToken(tokens);
  if (!accessToken) return { ok: false, error: 'Token YouTube expiré' };

  // 3. Load video file
  let videoBuffer: Buffer;
  if (video.videoUrl.startsWith('/api/youtube/file')) {
    const url = new URL(video.videoUrl, 'http://localhost');
    const key = url.searchParams.get('key');
    if (!key) return { ok: false, error: 'Clé fichier manquante' };
    const stored = await getFile(key);
    if (!stored) return { ok: false, error: 'Fichier vidéo introuvable' };
    videoBuffer = stored.data;
  } else if (video.videoUrl.startsWith('http')) {
    try {
      const extRes = await fetch(video.videoUrl);
      if (!extRes.ok) return { ok: false, error: `Téléchargement HTTP ${extRes.status}` };
      videoBuffer = Buffer.from(await extRes.arrayBuffer());
    } catch (err) {
      return { ok: false, error: `Téléchargement échoué: ${(err as Error).message}` };
    }
  } else {
    return { ok: false, error: 'URL vidéo non supportée' };
  }

  // 4. Upload to YouTube
  const result = await uploadToYouTube(accessToken, videoBuffer, {
    title: video.title,
    description: video.description,
    tags: video.tags,
    category: video.category,
    privacy: video.visibility,
  });

  if ('error' in result) return { ok: false, error: result.error };
  return { ok: true, youtubeUrl: result.youtubeUrl };
}

export async function GET(req: NextRequest) {
  // Auth check via CRON_SECRET
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  const expectedKey = process.env.CRON_SECRET || 'afrilaunch-cron-2026';
  if (key !== expectedKey) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const results: Array<{ videoId: string; action: string; notified: boolean }> = [];
  const config = await getConfig();

  // ── 1. Process explicitly scheduled videos (scheduledAt <= now) ────
  const dueVideos = await getVideosDueNow();
  for (const video of dueVideos) {
    try {
      await updateVideo(video.id, { status: 'publishing', updatedAt: Date.now() });

      // Try real auto-publish first
      const publishResult = await tryAutoPublish(video);

      if (publishResult.ok && publishResult.youtubeUrl) {
        // ✅ Auto-published successfully
        await updateVideo(video.id, {
          status: 'published',
          publishedAt: Date.now(),
          youtubeUrl: publishResult.youtubeUrl,
          updatedAt: Date.now(),
        });
        results.push({ videoId: video.id, action: 'auto-published to YouTube', notified: false });
        continue;
      }

      // ── Fallback: send email with YouTube Studio link ──
      const params = new URLSearchParams({
        title: video.title,
        description: video.description,
        tags: video.tags.join(','),
      });
      const studioUrl = `https://studio.youtube.com/videos/upload?${params.toString()}`;

      const schedule = await getUserSchedule(video.userId);
      let notified = false;

      if (schedule.autoNotifyEmail) {
        const users = await kvGet<{ users: Array<{ id: string; email: string; firstName: string }> }>('users');
        const user = users?.users?.find((u) => u.id === video.userId);
        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: `🎬 Votre vidéo est prête à publier : ${video.title}`,
            html: `
              <h2>🎬 Publication programmée</h2>
              <p>Bonjour ${user.firstName},</p>
              <p>Votre vidéo <strong>"${video.title}"</strong> est programmée pour maintenant.</p>
              <p style="color:#999;font-size:12px;">Note: la publication automatique n'a pas pu aboutir (${publishResult.error}). Connectez votre compte YouTube dans Réseaux sociaux pour activer l'auto-publish.</p>
              <h3>Détails</h3>
              <ul>
                <li><strong>Titre:</strong> ${video.title}</li>
                <li><strong>Description:</strong> ${video.description.slice(0, 200)}...</li>
                <li><strong>Tags:</strong> ${video.tags.join(', ')}</li>
              </ul>
              <p><a href="${studioUrl}" style="display:inline-block;padding:12px 24px;background:#ff0000;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">📤 Publier sur YouTube Studio</a></p>
              <hr>
              <p style="color:#666;font-size:12px;">AfriLaunch AI — Publication automatique</p>
            `,
            text: `Votre vidéo "${video.title}" est prête à publier. Lien: ${studioUrl}`,
          }).catch(() => { /* best-effort */ });
          notified = true;
        }
      }

      // Mark as 'publishing' (waiting for user action)
      await updateVideo(video.id, { status: 'publishing', error: publishResult.error, updatedAt: Date.now() });
      results.push({ videoId: video.id, action: `fallback email (${publishResult.error})`, notified });
    } catch (err) {
      await updateVideo(video.id, { status: 'failed', error: (err as Error).message });
      results.push({ videoId: video.id, action: `error: ${(err as Error).message}`, notified: false });
    }
  }

  // ── 2. Auto-schedule draft videos based on user calendars ─────────
  const autoSchedulable = await getAutoSchedulableVideos();
  for (const { video } of autoSchedulable) {
    try {
      await updateVideo(video.id, {
        status: 'scheduled',
        scheduledAt: Date.now(),
      });
      results.push({ videoId: video.id, action: 'auto-scheduled from calendar', notified: false });
    } catch (err) {
      results.push({ videoId: video.id, action: `auto-schedule error: ${(err as Error).message}`, notified: false });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    autoPublishEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    results,
    timestamp: new Date().toISOString(),
  });
}
