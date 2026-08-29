// AfriLaunch AI — YouTube cron (auto-publish scheduled videos)
// GET /api/youtube/cron?key=CRON_SECRET
//
// Called by Vercel Cron (or external cron like cron-job.org) every hour.
// Finds videos due now + auto-schedulable drafts based on user calendars.
// For each due video:
//   1. Marks status as 'publishing'
//   2. Sends notification (email/WhatsApp) with YouTube Studio pre-filled URL
//   3. (Future) Auto-uploads via YouTube Data API if OAuth configured
//
// The CRON_SECRET prevents unauthorized calls. Set it in Vercel env vars.

import { NextRequest, NextResponse } from 'next/server';
import { getVideosDueNow, getAutoSchedulableVideos, updateVideo, getUserSchedule } from '@/lib/youtube-store';
import { sendEmail } from '@/lib/email-sender';
import { getConfig } from '@/lib/config-store';
import { kvGet } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
      // Mark as publishing
      await updateVideo(video.id, { status: 'publishing', updatedAt: Date.now() });

      // Build YouTube Studio URL
      const params = new URLSearchParams({
        title: video.title,
        description: video.description,
        tags: video.tags.join(','),
      });
      const studioUrl = `https://studio.youtube.com/videos/upload?${params.toString()}`;

      // Get user's schedule to know notification preferences
      const schedule = await getUserSchedule(video.userId);
      let notified = false;

      // Send email notification if enabled
      if (schedule.autoNotifyEmail) {
        // Look up user email
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
              <h3>Détails</h3>
              <ul>
                <li><strong>Titre:</strong> ${video.title}</li>
                <li><strong>Description:</strong> ${video.description.slice(0, 200)}...</li>
                <li><strong>Tags:</strong> ${video.tags.join(', ')}</li>
              </ul>
              <p><a href="${studioUrl}" style="display:inline-block;padding:12px 24px;background:#ff0000;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">📤 Publier sur YouTube</a></p>
              <p style="color:#666;font-size:12px;">Le lien ouvre YouTube Studio avec les champs pré-remplis. Uploadez votre fichier vidéo puis cliquez sur Publier.</p>
              <hr>
              <p style="color:#666;font-size:12px;">AfriLaunch AI — Publication automatique</p>
            `,
            text: `Votre vidéo "${video.title}" est prête à publier. Lien: ${studioUrl}`,
          }).catch(() => { /* best-effort */ });
          notified = true;
        }
      }

      // Send WhatsApp notification if enabled (via Twilio)
      if (schedule.autoNotifyWhatsApp) {
        // TODO: implement WhatsApp notification via Twilio
        // For now, just log
        console.log(`[YouTube cron] WhatsApp notification pending for video ${video.id}`);
      }

      results.push({ videoId: video.id, action: 'published (notification sent)', notified });
    } catch (err) {
      await updateVideo(video.id, { status: 'failed', error: (err as Error).message });
      results.push({ videoId: video.id, action: `error: ${(err as Error).message}`, notified: false });
    }
  }

  // ── 2. Auto-schedule draft videos based on user calendars ─────────
  const autoSchedulable = await getAutoSchedulableVideos();
  for (const { video, schedule } of autoSchedulable) {
    try {
      // Mark as scheduled + set scheduledAt to now
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
    results,
    timestamp: new Date().toISOString(),
  });
}
