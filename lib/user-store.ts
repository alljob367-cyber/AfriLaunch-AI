// AfriLaunch AI — User store (server-side, persisted via Supabase KV)
// Manages users, their subscription plan, credits, and referral data.
// SERVER-ONLY: this module uses crypto. Do not import from client components.
// For client-safe types and constants, import from '@/lib/user-types'.

import crypto from 'crypto';
import { kvGet, kvSet } from './db';
import { PLANS, CREDIT_PACKS, type User, type PlanId, type Plan, type CreditPack } from './user-types';

// Re-export client-safe constants and types
export { PLANS, CREDIT_PACKS } from './user-types';
export type { User, PlanId, Plan, CreditPack };

interface UserStore {
  users: User[];
}

// ─── File I/O ─────────────────────────────────────────────────────────
async function readStore(): Promise<UserStore> {
  const store = await kvGet<UserStore>('users');
  return store ?? { users: [] };
}

async function writeStore(store: UserStore): Promise<void> {
  await kvSet('users', store);
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

  const user: User = {
    id: generateUserId(),
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    passwordHash: hashPassword(data.password),
    createdAt: now,
    // NO FREE TRIAL — user must pay before using the app.
    // New users get plan 'starter' but planStatus 'pending_payment' with 0 credits.
    // They can log in but every AI action is blocked until they pay
    // (handled in consumeCredits + a payment wall in the dashboard).
    plan: 'starter',
    planStatus: 'pending_payment',
    planStartedAt: null,
    planEndsAt: null,
    credits: 0,
    creditsUsedThisMonth: 0,
    creditsResetAt: now,
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

// List of admin emails — these users get unlimited free access to everything.
const ADMIN_EMAILS = new Set([
  'admin@albermon.com',
  'admin@afrilaunch.ai',
]);

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.toLowerCase());
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const store = await readStore();
  const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  if (user.passwordHash !== hashPassword(password)) return null;
  user.lastLoginAt = new Date().toISOString();

  // Auto-correct admin users on every login: ensure they have unlimited
  // access regardless of when they were created (pre/post payment-wall change).
  if (isAdminEmail(user.email)) {
    user.plan = 'enterprise';
    user.planStatus = 'active';
    user.credits = 999999;
    user.creditsUsedThisMonth = 0;
    user.planStartedAt = user.planStartedAt || new Date().toISOString();
    user.planEndsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // +1 year
    user.creditsResetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    (user as any).isAdmin = true;
  }

  await writeStore(store);
  return user;
}

// Ensure the admin user exists with the right credentials + unlimited access.
// Called by the admin login flow so the admin can use the dashboard without
// needing a separate user account.
// Password = the admin panel password (same as /admin/login).
export async function ensureAdminUser(adminPassword: string): Promise<User> {
  const store = await readStore();
  const adminEmail = 'admin@albermon.com';
  let user = store.users.find((u) => u.email.toLowerCase() === adminEmail);

  const now = new Date().toISOString();
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (!user) {
    // Create the admin user
    user = {
      id: 'usr_admin_' + crypto.randomBytes(6).toString('hex'),
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'AfriLaunch',
      passwordHash: hashPassword(adminPassword),
      createdAt: now,
      plan: 'enterprise',
      planStatus: 'active',
      planStartedAt: now,
      planEndsAt: nextYear,
      credits: 999999,
      creditsUsedThisMonth: 0,
      creditsResetAt: nextMonth,
      referralCode: 'admin' + crypto.randomBytes(3).toString('hex'),
      referredBy: null,
      referralCount: 0,
      referralCreditsEarned: 0,
      installedAgents: [],
      lastLoginAt: now,
      updatedAt: now,
      isAdmin: true,
    } as User;
    store.users.push(user);
  } else {
    // Update existing admin user: ensure admin flags + sync password
    user.passwordHash = hashPassword(adminPassword);
    user.plan = 'enterprise';
    user.planStatus = 'active';
    user.credits = 999999;
    user.creditsUsedThisMonth = 0;
    user.planStartedAt = user.planStartedAt || now;
    user.planEndsAt = nextYear;
    user.creditsResetAt = nextMonth;
    user.lastLoginAt = now;
    user.updatedAt = now;
    (user as any).isAdmin = true;
  }

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
  starter: 50,     // 50 messages/jour
  pro: 0,
  business: 0,
  enterprise: 0,
};

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export async function consumeCredits(id: string, amount: number): Promise<{ ok: boolean; user: User | null; error?: string; dailyLimit?: { limit: number; usedToday: number }; paymentRequired?: boolean }> {
  const store = await readStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) return { ok: false, user: null, error: 'Utilisateur introuvable' };

  // Admin bypass: admin users have unlimited credits
  if (user.email === 'admin@albermon.com' || user.email === 'admin@afrilaunch.ai' || (user as any).isAdmin === true) {
    return { ok: true, user };
  }

  // PAYMENT WALL — block all AI actions if user hasn't paid
  // (skip for negative amounts = refunds)
  if (amount > 0 && user.planStatus === 'pending_payment') {
    return {
      ok: false,
      user,
      error: 'Abonnement requis. Votre compte est en attente de paiement. Souscrivez un plan dans Abonnement pour débloquer l\'app.',
      paymentRequired: true,
    };
  }

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
interface UserSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

async function readUserSessions(): Promise<UserSession[]> {
  const sessions = await kvGet<UserSession[]>('user-sessions');
  return sessions ?? [];
}

async function writeUserSessions(sessions: UserSession[]): Promise<void> {
  await kvSet('user-sessions', sessions);
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
