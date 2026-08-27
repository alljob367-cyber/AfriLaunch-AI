// AfriLaunch AI — Ads store (server-side, persisted via Supabase KV)
// Stores incoming comments, DMs, and lead form submissions from Facebook Ads,
// Google Ads, and YouTube Ads — plus the AI-generated responses.

import { kvGet, kvSet } from './db';

// ─── Types ────────────────────────────────────────────────────────────
export type AdsPlatform = 'facebook' | 'google' | 'youtube';
export type ItemType = 'comment' | 'message' | 'lead';
export type ResponseStatus = 'pending' | 'responded' | 'failed' | 'manual';

export interface AdsItem {
  id: string;
  platform: AdsPlatform;
  type: ItemType;
  // Author
  authorName: string;
  authorId?: string;
  authorAvatarUrl?: string;
  // Content
  message: string; // the incoming comment/message/lead content
  postUrl?: string; // URL of the ad post / video
  postCaption?: string; // ad caption / video title
  // Metadata
  receivedAt: string; // ISO timestamp
  userId: string | null; // AfriLaunch user ID (null if unattributed)
  // AI response
  aiResponse: string | null;
  aiResponseStatus: ResponseStatus;
  aiRespondedAt: string | null;
  aiModel?: string;
  aiProvider?: string;
  // Manual override
  manualResponse?: string;
  isRead: boolean;
  isStarred: boolean;
  // Sentiment analysis (basic)
  sentiment: 'positive' | 'neutral' | 'negative' | 'question';
  // Lead-specific fields
  leadEmail?: string;
  leadPhone?: string;
  leadName?: string;
}

interface AdsStore {
  items: AdsItem[];
}

// ─── File I/O ─────────────────────────────────────────────────────────
async function readStore(): Promise<AdsStore> {
  const store = await kvGet<AdsStore>('ads-inbox');
  return store ?? { items: [] };
}

async function writeStore(store: AdsStore): Promise<void> {
  await kvSet('ads-inbox', store);
}

// ─── Public API ───────────────────────────────────────────────────────
export async function addAdsItem(item: Omit<AdsItem, 'id' | 'receivedAt' | 'aiResponse' | 'aiResponseStatus' | 'aiRespondedAt' | 'isRead' | 'isStarred' | 'sentiment'>): Promise<AdsItem> {
  const store = await readStore();
  const newItem: AdsItem = {
    ...item,
    id: 'ads_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    receivedAt: new Date().toISOString(),
    aiResponse: null,
    aiResponseStatus: 'pending',
    aiRespondedAt: null,
    isRead: false,
    isStarred: false,
    sentiment: detectSentiment(item.message),
  };
  store.items.unshift(newItem);
  // Cap at 1000 items
  if (store.items.length > 1000) store.items = store.items.slice(0, 1000);
  await writeStore(store);
  return newItem;
}

export async function getAdsItems(filters?: {
  platform?: AdsPlatform;
  type?: ItemType;
  status?: ResponseStatus;
  userId?: string;
  unreadOnly?: boolean;
  limit?: number;
}): Promise<AdsItem[]> {
  const store = await readStore();
  let items = store.items;
  if (filters?.platform) items = items.filter((i) => i.platform === filters.platform);
  if (filters?.type) items = items.filter((i) => i.type === filters.type);
  if (filters?.status) items = items.filter((i) => i.aiResponseStatus === filters.status);
  if (filters?.userId) items = items.filter((i) => i.userId === filters.userId);
  if (filters?.unreadOnly) items = items.filter((i) => !i.isRead);
  if (filters?.limit) items = items.slice(0, filters.limit);
  return items;
}

export async function getAdsItemById(id: string): Promise<AdsItem | null> {
  const store = await readStore();
  return store.items.find((i) => i.id === id) ?? null;
}

export async function updateAdsItem(id: string, updates: Partial<AdsItem>): Promise<AdsItem | null> {
  const store = await readStore();
  const item = store.items.find((i) => i.id === id);
  if (!item) return null;
  Object.assign(item, updates);
  await writeStore(store);
  return item;
}

export async function markAdsItemResponded(id: string, response: string, provider?: string, model?: string): Promise<AdsItem | null> {
  return updateAdsItem(id, {
    aiResponse: response,
    aiResponseStatus: 'responded',
    aiRespondedAt: new Date().toISOString(),
    aiProvider: provider,
    aiModel: model,
  });
}

export async function deleteAdsItem(id: string): Promise<boolean> {
  const store = await readStore();
  const before = store.items.length;
  store.items = store.items.filter((i) => i.id !== id);
  if (store.items.length === before) return false;
  await writeStore(store);
  return true;
}

export async function getAdsStats(): Promise<{
  total: number;
  byPlatform: Record<AdsPlatform, number>;
  byStatus: Record<ResponseStatus, number>;
  unreadCount: number;
  respondedCount: number;
  pendingCount: number;
  last24hCount: number;
}> {
  const store = await readStore();
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  return {
    total: store.items.length,
    byPlatform: {
      facebook: store.items.filter((i) => i.platform === 'facebook').length,
      google: store.items.filter((i) => i.platform === 'google').length,
      youtube: store.items.filter((i) => i.platform === 'youtube').length,
    },
    byStatus: {
      pending: store.items.filter((i) => i.aiResponseStatus === 'pending').length,
      responded: store.items.filter((i) => i.aiResponseStatus === 'responded').length,
      failed: store.items.filter((i) => i.aiResponseStatus === 'failed').length,
      manual: store.items.filter((i) => i.aiResponseStatus === 'manual').length,
    },
    unreadCount: store.items.filter((i) => !i.isRead).length,
    respondedCount: store.items.filter((i) => i.aiResponseStatus === 'responded').length,
    pendingCount: store.items.filter((i) => i.aiResponseStatus === 'pending').length,
    last24hCount: store.items.filter((i) => new Date(i.receivedAt).getTime() > dayAgo).length,
  };
}

// ─── Sentiment detection (basic keyword-based) ────────────────────────
function detectSentiment(text: string): 'positive' | 'neutral' | 'negative' | 'question' {
  const lower = text.toLowerCase();
  if (lower.includes('?') || lower.match(/^(combien|prix|comment|pourquoi|où|quand|qui|quel)/)) {
    return 'question';
  }
  const positiveWords = ['super', 'génial', 'parfait', 'excellent', 'top', 'joli', 'bien', 'bon', 'aime', 'adoré', 'love', 'great', 'amazing', 'bravo', 'félicitation'];
  const negativeWords = ['nul', 'mauvais', 'horrible', 'déçu', 'arnaque', 'trop cher', 'jamais', 'pire', 'bad', 'worst', 'scam'];
  if (positiveWords.some((w) => lower.includes(w))) return 'positive';
  if (negativeWords.some((w) => lower.includes(w))) return 'negative';
  return 'neutral';
}

// ─── Seed mock data (for demo/testing) ────────────────────────────────
export async function seedMockAdsData(): Promise<void> {
  const store = await readStore();
  if (store.items.length > 0) return; // don't seed if already has data

  const mockItems: Array<Omit<AdsItem, 'id' | 'receivedAt' | 'aiResponse' | 'aiResponseStatus' | 'aiRespondedAt' | 'isRead' | 'isStarred' | 'sentiment'>> = [
    {
      platform: 'facebook', type: 'comment',
      authorName: 'Awa Traoré', authorId: 'fb_awa123',
      message: 'Combien coûte la livraison à Bamako ?',
      postUrl: 'https://facebook.com/ads/post/123',
      postCaption: 'Promo Été 2024 - 30% sur toute la boutique',
      userId: null,
    },
    {
      platform: 'facebook', type: 'message',
      authorName: 'Ibrahim Sow', authorId: 'fb_ibrahim456',
      message: 'Bonjour, est-ce que vous avez ce modèle en taille 42 ?',
      postUrl: 'https://m.me/page/123',
      postCaption: 'Collection baskets urbaines',
      userId: null,
    },
    {
      platform: 'youtube', type: 'comment',
      authorName: 'Kwame Mensah', authorId: 'yt_kwame789',
      message: 'This looks amazing! Do you ship to Ghana?',
      postUrl: 'https://youtube.com/watch?v=abc123&lc=xyz',
      postCaption: 'Ad video — Découvrez Teranga Mode',
      userId: null,
    },
    {
      platform: 'google', type: 'lead',
      authorName: 'Fatou Bensouda', authorId: 'g_lead_001',
      message: 'Demande de devis pour 50 unités',
      leadEmail: 'fatou@abidjan-corp.ci', leadPhone: '+225 07 12 34 56 78',
      leadName: 'Fatou Bensouda',
      postUrl: 'https://ads.google.com/leadform/abc',
      postCaption: 'Google Ads Lead Form — Devis entreprise',
      userId: null,
    },
  ];

  for (const item of mockItems) {
    await addAdsItem(item);
  }
}
