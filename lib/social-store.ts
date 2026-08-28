// AfriLaunch AI — Social accounts store (server-side, persisted via Supabase KV)
// Stores connected social media accounts per user.

import crypto from 'crypto';
import { kvGet, kvSet } from './db';

export type SocialPlatform = 'instagram' | 'tiktok' | 'facebook' | 'whatsapp' | 'linkedin' | 'twitter';

export interface SocialAccount {
  id: string;
  userId: string;
  platform: SocialPlatform;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  followers: number;
  connected: boolean;
  connectedAt: string;
  updatedAt: string;
  // Token (simulated — in production, store OAuth tokens securely)
  accessToken?: string;
  // Metadata
  bio?: string;
  verified?: boolean;
}

interface SocialStore {
  accounts: SocialAccount[];
}

async function readStore(): Promise<SocialStore> {
  const store = await kvGet<SocialStore>('social-accounts');
  return store ?? { accounts: [] };
}

async function writeStore(store: SocialStore): Promise<void> {
  await kvSet('social-accounts', store);
}

export async function getSocialAccounts(userId: string): Promise<SocialAccount[]> {
  const store = await readStore();
  return store.accounts.filter((a) => a.userId === userId);
}

export async function connectSocialAccount(
  userId: string,
  platform: SocialPlatform,
  handle: string,
  displayName?: string,
): Promise<SocialAccount> {
  const store = await readStore();
  // Check if already connected
  const existing = store.accounts.find(
    (a) => a.userId === userId && a.platform === platform,
  );
  const now = new Date().toISOString();

  if (existing) {
    // Update
    existing.handle = handle;
    existing.displayName = displayName || handle;
    existing.connected = true;
    existing.connectedAt = now;
    existing.updatedAt = now;
    existing.accessToken = crypto.randomBytes(16).toString('hex');
    await writeStore(store);
    return existing;
  }

  // Create new
  const account: SocialAccount = {
    id: 'soc_' + crypto.randomBytes(8).toString('hex'),
    userId,
    platform,
    handle,
    displayName: displayName || handle,
    followers: 0,
    connected: true,
    connectedAt: now,
    updatedAt: now,
    accessToken: crypto.randomBytes(16).toString('hex'),
  };
  store.accounts.push(account);
  await writeStore(store);
  return account;
}

export async function disconnectSocialAccount(
  userId: string,
  platform: SocialPlatform,
): Promise<boolean> {
  const store = await readStore();
  const before = store.accounts.length;
  store.accounts = store.accounts.filter(
    (a) => !(a.userId === userId && a.platform === platform),
  );
  if (store.accounts.length === before) return false;
  await writeStore(store);
  return true;
}

export async function updateSocialAccount(
  id: string,
  updates: Partial<SocialAccount>,
): Promise<SocialAccount | null> {
  const store = await readStore();
  const account = store.accounts.find((a) => a.id === id);
  if (!account) return null;
  Object.assign(account, updates, { updatedAt: new Date().toISOString() });
  await writeStore(store);
  return account;
}

export function sanitizeAccount(account: SocialAccount): SocialAccount {
  // Don't expose the access token to the client
  return { ...account, accessToken: undefined };
}
