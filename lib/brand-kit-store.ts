// AfriLaunch AI — Brand Kit store
// Persists brand kits (logo + banner + cover + palette + typography) generated
// for each user. Each kit tracks generation progress so the dashboard can show
// "X / Y livrables prêts" before the user can download/share.
//
// Images are stored as base64 data URLs in the Supabase kv_store for simplicity.
// (No external upload needed — works on Vercel serverless out of the box.)

import { kvGet, kvSet } from './db';

export type AssetType = 'logo' | 'logo_dark' | 'banner_facebook' | 'banner_instagram' | 'banner_linkedin' | 'banner_youtube' | 'favicon';
export type AssetStatus = 'pending' | 'generating' | 'done' | 'failed';

export interface BrandAsset {
  type: AssetType;
  status: AssetStatus;
  prompt: string;       // the image-generation prompt used
  dataUrl?: string;     // base64 data URL (set when status === 'done')
  error?: string;       // set when status === 'failed'
  startedAt?: number;
  completedAt?: number;
}

export interface BrandKit {
  id: string;
  userId: string;
  businessName: string;
  industry: string;
  country: string;
  style: string;
  // AI-generated textual brand identity (from Branding Agent)
  identity: {
    brandName?: string;
    tagline?: string;
    description?: string;
    palette?: { primary?: string; secondary?: string; accent?: string; background?: string; text?: string };
    typography?: { heading?: string; body?: string };
    voice?: { tone?: string };
    socialKit?: { instagram?: { bio?: string; hashtags?: string[] }; twitter?: { bio?: string } };
  };
  // Visual assets (logos, banners, favicon)
  assets: BrandAsset[];
  status: 'pending' | 'running' | 'done' | 'failed';
  createdAt: number;
  updatedAt: number;
}

interface BrandKitsStore {
  kits: BrandKit[];
}

const KEY = 'brand-kits';
const MAX_KITS_PER_USER = 10;

async function readStore(): Promise<BrandKitsStore> {
  const s = await kvGet<BrandKitsStore>(KEY);
  return s ?? { kits: [] };
}

async function writeStore(s: BrandKitsStore): Promise<void> {
  // Cap per user (LRU)
  const byUser = new Map<string, BrandKit[]>();
  for (const k of s.kits) {
    if (!byUser.has(k.userId)) byUser.set(k.userId, []);
    byUser.get(k.userId)!.push(k);
  }
  let changed = false;
  for (const [userId, kits] of byUser) {
    if (kits.length > MAX_KITS_PER_USER) {
      kits.sort((a, b) => b.createdAt - a.createdAt);
      const toRemove = new Set(kits.slice(MAX_KITS_PER_USER).map((k) => k.id));
      s.kits = s.kits.filter((k) => !(k.userId === userId && toRemove.has(k.id)));
      changed = true;
    }
  }
  await kvSet(KEY, s);
  if (changed) s.kits = (await readStore()).kits;
}

export async function getBrandKit(id: string): Promise<BrandKit | null> {
  const s = await readStore();
  return s.kits.find((k) => k.id === id) ?? null;
}

export async function getUserBrandKits(userId: string): Promise<BrandKit[]> {
  const s = await readStore();
  return s.kits
    .filter((k) => k.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getLatestUserBrandKit(userId: string): Promise<BrandKit | null> {
  const kits = await getUserBrandKits(userId);
  return kits[0] ?? null;
}

export async function createBrandKit(input: {
  userId: string;
  businessName: string;
  industry: string;
  country: string;
  style: string;
  identity: BrandKit['identity'];
  assets: BrandAsset[];
}): Promise<BrandKit> {
  const s = await readStore();
  const now = Date.now();
  const kit: BrandKit = {
    id: 'kit_' + now.toString(36) + Math.random().toString(36).slice(2, 8),
    userId: input.userId,
    businessName: input.businessName,
    industry: input.industry,
    country: input.country,
    style: input.style,
    identity: input.identity,
    assets: input.assets,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  s.kits.push(kit);
  await writeStore(s);
  return kit;
}

export async function updateBrandAsset(
  kitId: string,
  assetType: AssetType,
  updates: Partial<BrandAsset>,
): Promise<BrandKit | null> {
  const s = await readStore();
  const kit = s.kits.find((k) => k.id === kitId);
  if (!kit) return null;
  const asset = kit.assets.find((a) => a.type === assetType);
  if (!asset) return null;
  Object.assign(asset, updates);
  kit.updatedAt = Date.now();
  // Update overall kit status based on assets
  const statuses = kit.assets.map((a) => a.status);
  if (statuses.every((st) => st === 'done')) kit.status = 'done';
  else if (statuses.some((st) => st === 'generating' || st === 'pending')) kit.status = 'running';
  else if (statuses.every((st) => st === 'failed')) kit.status = 'failed';
  await writeStore(s);
  return kit;
}

export async function updateBrandKitIdentity(
  kitId: string,
  identity: Partial<BrandKit['identity']>,
): Promise<BrandKit | null> {
  const s = await readStore();
  const kit = s.kits.find((k) => k.id === kitId);
  if (!kit) return null;
  kit.identity = { ...kit.identity, ...identity };
  kit.updatedAt = Date.now();
  await writeStore(s);
  return kit;
}

export async function deleteBrandKit(userId: string, kitId: string): Promise<boolean> {
  const s = await readStore();
  const before = s.kits.length;
  s.kits = s.kits.filter((k) => !(k.id === kitId && k.userId === userId));
  if (s.kits.length === before) return false;
  await writeStore(s);
  return true;
}

// Count completed assets for progress display ("3 / 7 livrables prêts")
export function getKitProgress(kit: BrandKit): { done: number; total: number; percent: number } {
  const total = kit.assets.length;
  const done = kit.assets.filter((a) => a.status === 'done').length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
}

// ─── Image cache (prompt hash → dataUrl) ──────────────────────────────
// Two users asking for a similar logo (e.g. "modern logo for restaurant")
// share the same generated image. This cuts image-gen costs by ~3x.
// Cache entries expire after 7 days to avoid stale results.

interface ImageCacheEntry {
  hash: string;
  prompt: string;
  size: string;
  dataUrl: string;
  createdAt: number;
  hitCount: number;
}

interface ImageCacheStore {
  entries: ImageCacheEntry[];
}

const CACHE_KEY = 'brand-kit-image-cache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_ENTRIES = 200;

async function readCache(): Promise<ImageCacheStore> {
  const s = await kvGet<ImageCacheStore>(CACHE_KEY);
  return s ?? { entries: [] };
}

async function writeCache(s: ImageCacheStore): Promise<void> {
  // Drop expired entries + enforce LRU cap
  const cutoff = Date.now() - CACHE_TTL_MS;
  s.entries = s.entries
    .filter((e) => e.createdAt >= cutoff)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_CACHE_ENTRIES);
  await kvSet(CACHE_KEY, s);
}

// Hash a prompt + size into a stable key.
// We use a simplified hash (not crypto-strong, but fast and collision-resistant enough).
function hashPrompt(prompt: string, size: string): string {
  const input = `${prompt}::${size}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash = hash & 0xffffffff;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

export async function getCachedImage(prompt: string, size: string): Promise<string | null> {
  const s = await readCache();
  const hash = hashPrompt(prompt, size);
  const entry = s.entries.find((e) => e.hash === hash);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) return null;
  // Increment hit count (best-effort, non-blocking)
  entry.hitCount += 1;
  writeCache(s).catch(() => { /* ignore */ });
  return entry.dataUrl;
}

export async function setCachedImage(prompt: string, size: string, dataUrl: string): Promise<void> {
  const s = await readCache();
  const hash = hashPrompt(prompt, size);
  // Replace existing entry if same hash
  const existingIdx = s.entries.findIndex((e) => e.hash === hash);
  const entry: ImageCacheEntry = {
    hash,
    prompt: prompt.slice(0, 500),
    size,
    dataUrl,
    createdAt: Date.now(),
    hitCount: existingIdx >= 0 ? s.entries[existingIdx].hitCount : 0,
  };
  if (existingIdx >= 0) s.entries[existingIdx] = entry;
  else s.entries.push(entry);
  await writeCache(s);
}

// Get cache stats for admin dashboard
export async function getCacheStats(): Promise<{ entries: number; totalHits: number; oldestAge: number }> {
  const s = await readCache();
  const now = Date.now();
  return {
    entries: s.entries.length,
    totalHits: s.entries.reduce((sum, e) => sum + e.hitCount, 0),
    oldestAge: s.entries.length > 0
      ? Math.round((now - Math.min(...s.entries.map((e) => e.createdAt))) / (60 * 60 * 1000))
      : 0,
  };
}

// ─── Monthly kit quota per plan ────────────────────────────────────────
// Prevents abuse on Business/Enterprise and keeps image-gen costs bounded.
// Quotas are checked at generation time. Enterprise = unlimited.

export const KIT_QUOTAS: Record<string, number> = {
  starter: 2,     // 2 kits/mois (14 images max)
  pro: 8,         // 8 kits/mois (56 images max)
  business: 30,   // 30 kits/mois (210 images max)
  enterprise: -1, // illimité
};

export async function countKitsThisMonth(userId: string): Promise<number> {
  const s = await readStore();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return s.kits.filter(
    (k) => k.userId === userId && k.createdAt >= startOfMonth,
  ).length;
}

export function getKitQuota(plan: string): { limit: number; remaining: number | null; used: number } {
  const limit = KIT_QUOTAS[plan] ?? KIT_QUOTAS.starter;
  return { limit, remaining: null, used: 0 }; // `used` is filled by caller
}
