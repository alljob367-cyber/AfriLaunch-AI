// AfriLaunch AI — Published sites store
// Persists user-generated websites in Supabase KV so they can be served
// at /s/<slug> publicly (no auth). Each site has a view counter.

import crypto from 'crypto';
import { kvGet, kvSet } from './db';

export interface PublishedSite {
  id: string;
  userId: string;
  slug: string;          // short URL-friendly ID, e.g. 'hotel-albermon-a1b2c3'
  title: string;         // business name (for SEO + display)
  html: string;          // full HTML document
  // Extracted from the HTML for SEO/OG meta tags
  metaDescription?: string;
  ogImage?: string;
  // Stats
  views: number;
  // Lifecycle
  createdAt: number;     // epoch ms
  updatedAt: number;
}

interface SitesStore {
  sites: PublishedSite[];
  // Lookup index: slug → siteId (so /s/:slug is O(1) without scanning all sites)
  slugIndex: Record<string, string>;
}

const KEY = 'published-sites';
const MAX_SITES = 5000;        // global cap (LRU eviction if exceeded)
const MAX_PER_USER = 25;       // per-user cap

async function readStore(): Promise<SitesStore> {
  const s = await kvGet<SitesStore>(KEY);
  return s ?? { sites: [], slugIndex: {} };
}

async function writeStore(s: SitesStore): Promise<void> {
  // LRU eviction: if global cap exceeded, drop oldest 10%
  if (s.sites.length > MAX_SITES) {
    s.sites.sort((a, b) => b.createdAt - a.createdAt);
    const keep = s.sites.slice(0, Math.floor(MAX_SITES * 0.9));
    s.sites = keep;
    // Rebuild slugIndex
    s.slugIndex = {};
    for (const site of keep) s.slugIndex[site.slug] = site.id;
  }
  await kvSet(KEY, s);
}

// Convert a business name to a URL-friendly slug
function slugify(name: string): string {
  const base = (name || 'site')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'site';
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}

// Extract <title> and <meta name="description"> from the HTML for SEO
function extractMeta(html: string): { title?: string; description?: string; ogImage?: string } {
  const result: { title?: string; description?: string; ogImage?: string } = {};

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) result.title = titleMatch[1].trim().slice(0, 100);

  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (descMatch) result.description = descMatch[1].trim().slice(0, 200);

  const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogMatch) result.ogImage = ogMatch[1].trim();

  return result;
}

export interface PublishResult {
  ok: boolean;
  site?: PublishedSite;
  error?: string;
  url?: string;
}

export async function publishSite(userId: string, html: string, title: string): Promise<PublishResult> {
  if (!html || html.length < 100) {
    return { ok: false, error: 'HTML trop court ou invalide' };
  }
  if (html.length > 500_000) {
    return { ok: false, error: 'HTML trop volumineux (max 500 Ko)' };
  }

  const s = await readStore();

  // Per-user cap
  const userSiteCount = s.sites.filter((site) => site.userId === userId).length;
  if (userSiteCount >= MAX_PER_USER) {
    return { ok: false, error: `Limite atteinte (${MAX_PER_USER} sites par utilisateur). Supprimez un ancien site.` };
  }

  // Generate unique slug
  let slug = slugify(title);
  while (s.slugIndex[slug]) {
    slug = slugify(title);
  }

  const now = Date.now();
  const meta = extractMeta(html);
  const site: PublishedSite = {
    id: 'site_' + crypto.randomBytes(8).toString('hex'),
    userId,
    slug,
    title: (title || meta.title || 'Mon site').slice(0, 100),
    html,
    metaDescription: meta.description,
    ogImage: meta.ogImage,
    views: 0,
    createdAt: now,
    updatedAt: now,
  };

  s.sites.push(site);
  s.slugIndex[slug] = site.id;
  await writeStore(s);

  return { ok: true, site };
}

export async function getSiteBySlug(slug: string): Promise<PublishedSite | null> {
  const s = await readStore();
  const id = s.slugIndex[slug];
  if (!id) return null;
  return s.sites.find((site) => site.id === id) ?? null;
}

export async function getUserSites(userId: string): Promise<PublishedSite[]> {
  const s = await readStore();
  return s.sites
    .filter((site) => site.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteSite(userId: string, siteId: string): Promise<boolean> {
  const s = await readStore();
  const site = s.sites.find((x) => x.id === siteId && x.userId === userId);
  if (!site) return false;
  s.sites = s.sites.filter((x) => x.id !== siteId);
  delete s.slugIndex[site.slug];
  await writeStore(s);
  return true;
}

// Increment view counter (called when /s/:slug is hit). Best-effort —
// we don't fail the request if the counter can't be updated.
export async function incrementViews(slug: string): Promise<void> {
  try {
    const s = await readStore();
    const id = s.slugIndex[slug];
    if (!id) return;
    const site = s.sites.find((x) => x.id === id);
    if (site) {
      site.views += 1;
      await writeStore(s);
    }
  } catch {
    // ignore — view counter is best-effort
  }
}

// Public-safe representation (no HTML — used for listing in dashboard)
export function sanitizeSite(site: PublishedSite) {
  return {
    id: site.id,
    slug: site.slug,
    title: site.title,
    metaDescription: site.metaDescription,
    views: site.views,
    createdAt: site.createdAt,
    updatedAt: site.updatedAt,
  };
}
