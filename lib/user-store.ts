// AfriLaunch AI — User store (server-side, persisted to JSON file)
// Manages users, their subscription plan, credits, and referral data.
// SERVER-ONLY: this module uses fs and crypto. Do not import from client components.
// For client-safe types and constants, import from '@/lib/user-types'.

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PLANS, CREDIT_PACKS, type User, type PlanId, type Plan, type CreditPack } from './user-types';

// Re-export client-safe constants and types
export { PLANS, CREDIT_PACKS } from './user-types';
export type { User, PlanId, Plan, CreditPack };

const USERS_PATH = path.join('/home/z/my-project/data', 'users.json');

interface UserStore {
  users: User[];
}

// ─── File I/O ─────────────────────────────────────────────────────────
async function readStore(): Promise<UserStore> {
  try {
    const raw = await fs.readFile(USERS_PATH, 'utf-8');
    return JSON.parse(raw) as UserStore;
  } catch {
    return { users: [] };
  }
}

async function writeStore(store: UserStore): Promise<void> {
  await fs.mkdir(path.dirname(USERS_PATH), { recursive: true });
  await fs.writeFile(USERS_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

// ─── Public API ───────────────────────────────────────────────────────
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateReferralCode(firstName: string): string {
  const base = firstName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 6) || 'user';
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}${suffix}`;
}

function generateUserId(): string {
  return 'usr_' + crypto.randomBytes(12).toString('hex');
}

export async function createUser(data: {
  email: string;
  firstName: string;
  lastName?: string;
  password: string;
  referredBy?: string;
}): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const store = await readStore();
  const existing = store.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
  if (existing) {
    return { ok: false, error: 'Un compte existe déjà avec cet email' };
  }

  // Validate referral code if provided
  let referrer: User | undefined;
  if (data.referredBy) {
    referrer = store.users.find((u) => u.referralCode === data.referredBy);
    if (!referrer) {
      return { ok: false, error: 'Code de parrainage invalide' };
    }
  }

  const now = new Date().toISOString();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const user: User = {
    id: generateUserId(),
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    passwordHash: hashPassword(data.password),
    createdAt: now,
    plan: 'free',
    planStatus: 'active',
    planStartedAt: now,
    planEndsAt: null,
    credits: PLANS.free.creditsPerMonth,
    creditsUsedThisMonth: 0,
    creditsResetAt: nextMonth.toISOString(),
    referralCode: generateReferralCode(data.firstName),
    referredBy: data.referredBy ?? null,
    referralCount: 0,
    referralCreditsEarned: 0,
    installedAgents: [],
    lastLoginAt: null,
    updatedAt: now,
  };

  store.users.push(user);

  // Reward referrer with 100 credits + increment their count
  if (referrer) {
    referrer.credits += 100;
    referrer.referralCount += 1;
    referrer.referralCreditsEarned += 100;
    referrer.updatedAt = now;
  }

  await writeStore(store);
  return { ok: true, user };
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const store = await readStore();
  const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  if (user.passwordHash !== hashPassword(password)) return null;
  user.lastLoginAt = new Date().toISOString();
  await writeStore(store);
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  const store = await readStore();
  return store.users.find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const store = await readStore();
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getUserByTelegramId(telegramUserId: number): Promise<User | null> {
  const store = await readStore();
  return store.users.find((u) => u.telegramUserId === telegramUserId) ?? null;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const store = await readStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) return null;
  Object.assign(user, updates, { updatedAt: new Date().toISOString() });
  await writeStore(store);
  return user;
}

export async function changeUserPlan(id: string, plan: PlanId, paymentProvider?: string): Promise<User | null> {
  return updateUser(id, {
    plan,
    planStatus: 'active',
    planStartedAt: new Date().toISOString(),
    credits: PLANS[plan].creditsPerMonth === -1 ? 999999 : PLANS[plan].creditsPerMonth,
    creditsUsedThisMonth: 0,
    creditsResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

export async function addCredits(id: string, amount: number): Promise<User | null> {
  const store = await readStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) return null;
  user.credits += amount;
  user.updatedAt = new Date().toISOString();
  await writeStore(store);
  return user;
}

// Daily limit per plan (in credits). 0 = no daily limit.
const DAILY_LIMITS: Record<PlanId, number> = {
  free: 10,        // 10 messages/jour
  starter: 0,      // pas de plafond quotidien (plafond mensuel seulement)
  pro: 0,
  business: 0,
  enterprise: 0,
};

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export async function consumeCredits(id: string, amount: number): Promise<{ ok: boolean; user: User | null; error?: string; dailyLimit?: { limit: number; usedToday: number } }> {
  const store = await readStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) return { ok: false, user: null, error: 'Utilisateur introuvable' };

  // Check monthly reset
  if (new Date(user.creditsResetAt) < new Date()) {
    const planCredits = PLANS[user.plan].creditsPerMonth;
    user.credits = planCredits === -1 ? 999999 : planCredits;
    user.creditsUsedThisMonth = 0;
    user.creditsResetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  // Check daily limit (for Free plan mainly)
  const dailyLimit = DAILY_LIMITS[user.plan] || 0;
  const today = new Date();
  const lastResetDate = (user as any).dailyResetAt ? new Date((user as any).dailyResetAt) : null;
  if (!lastResetDate || !isSameDay(lastResetDate, today)) {
    (user as any).creditsUsedToday = 0;
    (user as any).dailyResetAt = today.toISOString();
  }
  const usedToday = (user as any).creditsUsedToday || 0;

  // Allow negative amount = refund (skip daily limit check)
  if (amount > 0 && dailyLimit > 0 && usedToday + amount > dailyLimit) {
    return {
      ok: false,
      user,
      error: `Limite quotidienne atteinte (${dailyLimit} messages/jour pour le plan ${PLANS[user.plan].name}). Passez à un plan supérieur pour des usages illimités.`,
      dailyLimit: { limit: dailyLimit, usedToday },
    };
  }

  if (user.credits < amount) {
    return { ok: false, user, error: 'Crédits insuffisants. Rechargez votre compte.' };
  }

  user.credits -= amount;
  user.creditsUsedThisMonth += amount;
  if (amount > 0) {
    (user as any).creditsUsedToday = usedToday + amount;
  }
  user.updatedAt = new Date().toISOString();
  await writeStore(store);
  return { ok: true, user };
}

// Returns the user's daily usage info (for UI display)
export async function getDailyUsage(id: string): Promise<{ limit: number; usedToday: number; remaining: number }> {
  const user = await getUserById(id);
  if (!user) return { limit: 0, usedToday: 0, remaining: 0 };
  const dailyLimit = DAILY_LIMITS[user.plan] || 0;
  const today = new Date();
  const lastResetDate = (user as any).dailyResetAt ? new Date((user as any).dailyResetAt) : null;
  if (!lastResetDate || !isSameDay(lastResetDate, today)) {
    return { limit: dailyLimit, usedToday: 0, remaining: dailyLimit };
  }
  const usedToday = (user as any).creditsUsedToday || 0;
  return { limit: dailyLimit, usedToday, remaining: Math.max(0, dailyLimit - usedToday) };
}

export async function linkTelegramAccount(userId: string, telegramUserId: number, telegramUsername: string): Promise<User | null> {
  return updateUser(userId, {
    telegramUserId,
    telegramUsername,
    telegramLinkedAt: new Date().toISOString(),
  });
}

export async function installAgent(userId: string, agentId: string): Promise<User | null> {
  const store = await readStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;
  if (!user.installedAgents.includes(agentId)) {
    user.installedAgents.push(agentId);
    user.updatedAt = new Date().toISOString();
    await writeStore(store);
  }
  return user;
}

export async function uninstallAgent(userId: string, agentId: string): Promise<User | null> {
  const store = await readStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;
  user.installedAgents = user.installedAgents.filter((a) => a !== agentId);
  user.updatedAt = new Date().toISOString();
  await writeStore(store);
  return user;
}

// ─── Session tokens (simple JWT-like, server-side) ────────────────────
const SESSIONS_PATH = path.join('/home/z/my-project/data', 'user-sessions.json');

interface UserSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

async function readUserSessions(): Promise<UserSession[]> {
  try {
    const raw = await fs.readFile(SESSIONS_PATH, 'utf-8');
    return JSON.parse(raw) as UserSession[];
  } catch {
    return [];
  }
}

async function writeUserSessions(sessions: UserSession[]): Promise<void> {
  await fs.mkdir(path.dirname(SESSIONS_PATH), { recursive: true });
  await fs.writeFile(SESSIONS_PATH, JSON.stringify(sessions, null, 2), 'utf-8');
}

export async function createUserSession(userId: string, expiryHours = 24 * 7): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const session: UserSession = {
    token,
    userId,
    createdAt: now,
    expiresAt: now + expiryHours * 60 * 60 * 1000,
  };
  const sessions = await readUserSessions();
  sessions.push(session);
  await writeUserSessions(sessions);
  return token;
}

export async function validateUserSession(token: string): Promise<User | null> {
  if (!token) return null;
  const sessions = await readUserSessions();
  const now = Date.now();
  const session = sessions.find((s) => s.token === token && s.expiresAt > now);
  if (!session) return null;
  // Cleanup expired
  const active = sessions.filter((s) => s.expiresAt > now);
  if (active.length !== sessions.length) await writeUserSessions(active);
  return getUserById(session.userId);
}

export async function destroyUserSession(token: string): Promise<void> {
  const sessions = await readUserSessions();
  const remaining = sessions.filter((s) => s.token !== token);
  await writeUserSessions(remaining);
}

// ─── Sanitize user for client (strip sensitive) ───────────────────────
export function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _ph, ...rest } = user;
  return rest;
}
