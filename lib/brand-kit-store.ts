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
