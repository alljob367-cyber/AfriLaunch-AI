// AfriLaunch AI — Organization store (server-side, persisted via Supabase KV)
// Each user has ONE organization. Creating it unlocks the full dashboard.

import crypto from 'crypto';
import { kvGet, kvSet } from './db';

export interface Organization {
  id: string;
  userId: string;
  name: string;
  description: string;
  country: string;
  industry: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  logo: string | null; // emoji or URL
  createdAt: string;
  updatedAt: string;
}

interface OrgStore {
  organizations: Organization[];
}

async function readStore(): Promise<OrgStore> {
  const store = await kvGet<OrgStore>('organizations');
  return store ?? { organizations: [] };
}

async function writeStore(store: OrgStore): Promise<void> {
  await kvSet('organizations', store);
}

export async function createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
  const store = await readStore();
  // Check if user already has an org
  const existing = store.organizations.find((o) => o.userId === data.userId);
  if (existing) {
    // Update instead of create
    const updated = await updateOrganization(existing.id, data);
    return updated || existing;
  }
  const now = new Date().toISOString();
  const org: Organization = {
    ...data,
    id: 'org_' + crypto.randomBytes(12).toString('hex'),
    createdAt: now,
    updatedAt: now,
  };
  store.organizations.push(org);
  await writeStore(store);
  return org;
}

export async function getOrganizationByUserId(userId: string): Promise<Organization | null> {
  const store = await readStore();
  return store.organizations.find((o) => o.userId === userId) ?? null;
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const store = await readStore();
  return store.organizations.find((o) => o.id === id) ?? null;
}

export async function updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | null> {
  const store = await readStore();
  const org = store.organizations.find((o) => o.id === id);
  if (!org) return null;
  Object.assign(org, updates, { updatedAt: new Date().toISOString() });
  await writeStore(store);
  return org;
}

export async function deleteOrganization(id: string): Promise<boolean> {
  const store = await readStore();
  const before = store.organizations.length;
  store.organizations = store.organizations.filter((o) => o.id !== id);
  if (store.organizations.length === before) return false;
  await writeStore(store);
  return true;
}

export function sanitizeOrg(org: Organization): Organization {
  return { ...org };
}
