// AfriLaunch AI — YouTube scheduling store
// Manages videos + publish calendar + queue for each user.
//
// Flow:
//   1. User creates a VideoPost (title, description, tags, videoUrl, thumbnailPrompt)
//      — videoUrl can be a YouTube upload URL (already uploaded) or a file URL
//   2. User sets a ScheduleConfig (activeDays, time, frequency, timezone)
//   3. Cron endpoint /api/youtube/cron runs every hour → finds videos due now
//      → marks them as 'publishing' → returns YouTube Studio upload URL
//      → user gets email/WhatsApp notification "your video is ready to publish"
//
// Real auto-upload via YouTube Data API v3 requires OAuth 2.0 per user
// (Google Cloud project + consent screen). Phase 1 uses the manual deep-link
// approach: we prepare everything and the user clicks 1 link to finalize.

import { kvGet, kvSet } from './db';

export type VideoStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'canceled';

export interface VideoPost {
  id: string;
  userId: string;
  // Content (AI-generated or user-provided)
  title: string;
  description: string;
  tags: string[];
  category: string;          // e.g. 'People & Blogs', 'Education', 'Comedy'
  visibility: 'public' | 'unlisted' | 'private';
  // Video source
  videoUrl: string;          // YouTube upload URL, Drive link, or direct file URL
  thumbnailPrompt?: string;  // AI prompt for thumbnail (used by brand-kit image gen)
  thumbnailUrl?: string;     // generated thumbnail dataUrl
  // Scheduling
  scheduledAt: number | null; // epoch ms — when to publish (null = use calendar)
  status: VideoStatus;
  publishedAt?: number;
  youtubeUrl?: string;        // set when published
  error?: string;
  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface ScheduleConfig {
  userId: string;
  enabled: boolean;
  // Calendar
  activeDays: number[];      // [1,3,5] = Mon, Wed, Fri (0=Sun)
  publishTime: string;       // "18:00" — local time
  timezone: string;          // e.g. 'Africa/Douala'
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  // Auto-publish behavior
  autoNotifyEmail: boolean;  // send email when video is due
  autoNotifyWhatsApp: boolean; // send WhatsApp message when video is due
  // Quota
  maxVideosPerWeek: number;  // cap to prevent abuse
  updatedAt: number;
}

interface YouTubeStore {
  videos: VideoPost[];
  schedules: ScheduleConfig[];
}

const KEY = 'youtube-store';
const MAX_VIDEOS_PER_USER = 100;

async function readStore(): Promise<YouTubeStore> {
  const s = await kvGet<YouTubeStore>(KEY);
  return s ?? { videos: [], schedules: [] };
}

async function writeStore(s: YouTubeStore): Promise<void> {
  // Cap videos per user (LRU)
  const byUser = new Map<string, VideoPost[]>();
  for (const v of s.videos) {
    if (!byUser.has(v.userId)) byUser.set(v.userId, []);
    byUser.get(v.userId)!.push(v);
  }
  let changed = false;
  for (const [userId, vids] of byUser) {
    if (vids.length > MAX_VIDEOS_PER_USER) {
      vids.sort((a, b) => b.createdAt - a.createdAt);
      const toRemove = new Set(vids.slice(MAX_VIDEOS_PER_USER).map((v) => v.id));
      s.videos = s.videos.filter((v) => !(v.userId === userId && toRemove.has(v.id)));
      changed = true;
    }
  }
  await kvSet(KEY, s);
  if (changed) s.videos = (await readStore()).videos;
}

// ─── Videos CRUD ──────────────────────────────────────────────────────

export async function getUserVideos(userId: string): Promise<VideoPost[]> {
  const s = await readStore();
  return s.videos
    .filter((v) => v.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getVideo(id: string): Promise<VideoPost | null> {
  const s = await readStore();
  return s.videos.find((v) => v.id === id) ?? null;
}

export async function createVideo(input: Omit<VideoPost, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: VideoStatus }): Promise<VideoPost> {
  const s = await readStore();
  const now = Date.now();
  const video: VideoPost = {
    ...input,
    id: 'yt_' + now.toString(36) + Math.random().toString(36).slice(2, 8),
    status: input.status || 'draft',
    createdAt: now,
    updatedAt: now,
  };
  s.videos.push(video);
  await writeStore(s);
  return video;
}

export async function updateVideo(id: string, updates: Partial<VideoPost>): Promise<VideoPost | null> {
  const s = await readStore();
  const v = s.videos.find((x) => x.id === id);
  if (!v) return null;
  Object.assign(v, updates, { updatedAt: Date.now() });
  await writeStore(s);
  return v;
}

export async function deleteVideo(userId: string, id: string): Promise<boolean> {
  const s = await readStore();
  const before = s.videos.length;
  s.videos = s.videos.filter((v) => !(v.id === id && v.userId === userId));
  if (s.videos.length === before) return false;
  await writeStore(s);
  return true;
}

// ─── Schedule config ──────────────────────────────────────────────────

export function getDefaultSchedule(userId: string): ScheduleConfig {
  return {
    userId,
    enabled: false,
    activeDays: [1, 3, 5],    // Mon, Wed, Fri
    publishTime: '18:00',
    timezone: 'Africa/Douala',
    frequency: 'weekly',
    autoNotifyEmail: true,
    autoNotifyWhatsApp: false,
    maxVideosPerWeek: 3,
    updatedAt: Date.now(),
  };
}

export async function getUserSchedule(userId: string): Promise<ScheduleConfig> {
  const s = await readStore();
  return s.schedules.find((x) => x.userId === userId) ?? getDefaultSchedule(userId);
}

export async function upsertUserSchedule(userId: string, updates: Partial<ScheduleConfig>): Promise<ScheduleConfig> {
  const s = await readStore();
  let cfg = s.schedules.find((x) => x.userId === userId);
  if (!cfg) {
    cfg = getDefaultSchedule(userId);
    s.schedules.push(cfg);
  }
  Object.assign(cfg, updates, { updatedAt: Date.now() });
  await writeStore(s);
  return cfg;
}

// ─── Cron: find videos due now ────────────────────────────────────────
// Returns videos with status 'scheduled' AND scheduledAt <= now.
// Used by /api/youtube/cron to trigger publishing.

export async function getVideosDueNow(): Promise<VideoPost[]> {
  const s = await readStore();
  const now = Date.now();
  return s.videos.filter((v) =>
    v.status === 'scheduled' &&
    v.scheduledAt !== null &&
    v.scheduledAt <= now,
  );
}

// Also find videos that should be auto-scheduled based on the user's calendar
// (videos in 'draft' status with scheduledAt === null, when the calendar says
// it's time to publish and the user hasn't reached their weekly quota).
export async function getAutoSchedulableVideos(now: Date = new Date()): Promise<Array<{ video: VideoPost; schedule: ScheduleConfig }>> {
  const s = await readStore();
  const result: Array<{ video: VideoPost; schedule: ScheduleConfig }> = [];
  const day = now.getDay();
  const hhmm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  for (const schedule of s.schedules) {
    if (!schedule.enabled) continue;
    if (!schedule.activeDays.includes(day)) continue;
    // Check if current time is within 60 min of publishTime (cron runs hourly)
    const [ph, pm] = schedule.publishTime.split(':').map(Number);
    const schedMin = ph * 60 + pm;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (Math.abs(nowMin - schedMin) > 60) continue;

    // Find draft videos for this user
    const drafts = s.videos.filter((v) =>
      v.userId === schedule.userId &&
      v.status === 'draft' &&
      v.scheduledAt === null,
    );
    if (drafts.length === 0) continue;

    // Check weekly quota
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const publishedThisWeek = s.videos.filter((v) =>
      v.userId === schedule.userId &&
      (v.status === 'published' || v.status === 'publishing' || v.status === 'scheduled') &&
      v.createdAt >= weekAgo,
    ).length;
    if (publishedThisWeek >= schedule.maxVideosPerWeek) continue;

    // Take the oldest draft
    const oldest = drafts.sort((a, b) => a.createdAt - b.createdAt)[0];
    result.push({ video: oldest, schedule });
  }
  return result;
}
