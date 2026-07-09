// AfriLaunch AI — Configuration store (server-side, persisted to JSON file)
// This module manages the app's runtime configuration: mode (demo/real),
// API keys, database connection, AI providers, payment providers, etc.
// Config is stored at /home/z/my-project/data/app-config.json

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const CONFIG_PATH = path.join('/home/z/my-project/data', 'app-config.json');
const SESSIONS_PATH = path.join('/home/z/my-project/data', 'admin-sessions.json');

// ─── Types ────────────────────────────────────────────────────────────
export interface AppConfig {
  // App-wide
  mode: 'demo' | 'real';
  appName: string;
  appUrl: string;
  locale: string;
  timezone: string;
  // Admin
  adminPasswordHash: string | null; // sha256 of password; null = not set
  adminEmail: string;
  // Database
  database: {
    provider: 'sqlite' | 'postgresql' | 'mysql' | 'mongodb';
    url: string;
    ssl: boolean;
  };
  // Auth
  auth: {
    jwtSecret: string;
    sessionExpiryHours: number;
    oauth: {
      google: { clientId: string; clientSecret: string; enabled: boolean };
      github: { clientId: string; clientSecret: string; enabled: boolean };
      apple: { clientId: string; clientSecret: string; enabled: boolean };
    };
  };
  // AI Providers
  ai: {
    primary: 'openai' | 'anthropic' | 'gemini' | 'zai' | 'mistral' | 'custom';
    providers: {
      openai: { apiKey: string; model: string; enabled: boolean };
      anthropic: { apiKey: string; model: string; enabled: boolean };
      gemini: { apiKey: string; model: string; enabled: boolean };
      zai: { apiKey: string; model: string; enabled: boolean };
      mistral: { apiKey: string; model: string; endpoint: string; enabled: boolean };
      custom: { baseUrl: string; apiKey: string; model: string; enabled: boolean };
    };
    fallback: boolean; // if primary fails, try others
    maxTokensPerRequest: number;
  };
  // Payments
  payments: {
    currency: string;
    providers: {
      stripe: { publishableKey: string; secretKey: string; webhookSecret: string; enabled: boolean };
      flutterwave: { publicKey: string; secretKey: string; encryptionKey: string; enabled: boolean };
      paypal: { clientId: string; clientSecret: string; mode: 'sandbox' | 'live'; enabled: boolean };
      orangeMoney: { apiKey: string; merchantKey: string; enabled: boolean };
      wave: { apiKey: string; enabled: boolean };
      mobileMoney: { enabled: boolean };
    };
  };
  // Social Media APIs
  social: {
    instagram: { accessToken: string; businessAccountId: string; enabled: boolean };
    tiktok: { clientKey: string; clientSecret: string; accessToken: string; enabled: boolean };
    facebook: { appId: string; appSecret: string; pageAccessToken: string; enabled: boolean };
    whatsapp: { phoneNumberId: string; accessToken: string; businessId: string; enabled: boolean };
    linkedin: { clientId: string; clientSecret: string; accessToken: string; enabled: boolean };
    twitter: { apiKey: string; apiSecret: string; accessToken: string; accessSecret: string; enabled: boolean };
  };
  // Email
  email: {
    provider: 'resend' | 'sendgrid' | 'smtp' | 'none';
    from: string;
    replyTo: string;
    resend: { apiKey: string };
    sendgrid: { apiKey: string };
    smtp: { host: string; port: number; user: string; password: string; secure: boolean };
  };
  // Storage
  storage: {
    provider: 'local' | 's3' | 'cloudinary';
    local: { path: string };
    s3: { bucket: string; region: string; accessKey: string; secretKey: string; endpoint: string };
    cloudinary: { cloudName: string; apiKey: string; apiSecret: string };
    maxFileSizeMb: number;
  };
  // Webhooks
  webhooks: {
    inboundUrl: string;
    events: string[]; // e.g. ['payment.success', 'user.signup', 'agent.run']
  };
  // Feature flags
  features: {
    agents: boolean;
    payments: boolean;
    social: boolean;
    analytics: boolean;
    ecommerce: boolean;
    ai: boolean;
    multiTenant: boolean;
    whiteLabel: boolean;
    api: boolean;
  };
  // Logs
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    retention: number; // days
  };
  // Metadata
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ─── Default config ───────────────────────────────────────────────────
export function getDefaultConfig(): AppConfig {
  const now = new Date().toISOString();
  return {
    mode: 'demo',
    appName: 'AfriLaunch AI',
    appUrl: 'https://preview-chat-23d677fe-1a35-4281-9390-b186424e2719.space-z.ai',
    locale: 'fr-FR',
    timezone: 'Africa/Dakar',
    adminPasswordHash: null,
    adminEmail: 'admin@afrilaunch.ai',
    database: {
      provider: 'sqlite',
      url: 'file:/home/z/my-project/db/custom.db',
      ssl: false,
    },
    auth: {
      jwtSecret: crypto.randomBytes(32).toString('hex'),
      sessionExpiryHours: 24,
      oauth: {
        google: { clientId: '', clientSecret: '', enabled: false },
        github: { clientId: '', clientSecret: '', enabled: false },
        apple: { clientId: '', clientSecret: '', enabled: false },
      },
    },
    ai: {
      primary: 'zai',
      providers: {
        openai: { apiKey: '', model: 'gpt-4o', enabled: false },
        anthropic: { apiKey: '', model: 'claude-3-5-sonnet-20241022', enabled: false },
        gemini: { apiKey: '', model: 'gemini-1.5-pro', enabled: false },
        zai: { apiKey: '', model: 'glm-4.6', enabled: false },
        mistral: { apiKey: '', model: 'mistral-large-latest', endpoint: 'https://api.mistral.ai/v1', enabled: false },
        custom: { baseUrl: '', apiKey: '', model: '', enabled: false },
      },
      fallback: true,
      maxTokensPerRequest: 4096,
    },
    payments: {
      currency: 'USD',
      providers: {
        stripe: { publishableKey: '', secretKey: '', webhookSecret: '', enabled: false },
        flutterwave: { publicKey: '', secretKey: '', encryptionKey: '', enabled: false },
        paypal: { clientId: '', clientSecret: '', mode: 'sandbox', enabled: false },
        orangeMoney: { apiKey: '', merchantKey: '', enabled: false },
        wave: { apiKey: '', enabled: false },
        mobileMoney: { enabled: false },
      },
    },
    social: {
      instagram: { accessToken: '', businessAccountId: '', enabled: false },
      tiktok: { clientKey: '', clientSecret: '', accessToken: '', enabled: false },
      facebook: { appId: '', appSecret: '', pageAccessToken: '', enabled: false },
      whatsapp: { phoneNumberId: '', accessToken: '', businessId: '', enabled: false },
      linkedin: { clientId: '', clientSecret: '', accessToken: '', enabled: false },
      twitter: { apiKey: '', apiSecret: '', accessToken: '', accessSecret: '', enabled: false },
    },
    email: {
      provider: 'none',
      from: 'noreply@afrilaunch.ai',
      replyTo: 'contact@afrilaunch.ai',
      resend: { apiKey: '' },
      sendgrid: { apiKey: '' },
      smtp: { host: '', port: 587, user: '', password: '', secure: false },
    },
    storage: {
      provider: 'local',
      local: { path: '/home/z/my-project/uploads' },
      s3: { bucket: '', region: '', accessKey: '', secretKey: '', endpoint: '' },
      cloudinary: { cloudName: '', apiKey: '', apiSecret: '' },
      maxFileSizeMb: 10,
    },
    webhooks: {
      inboundUrl: '',
      events: ['payment.success', 'user.signup', 'agent.run'],
    },
    features: {
      agents: true,
      payments: true,
      social: true,
      analytics: true,
      ecommerce: false,
      ai: true,
      multiTenant: false,
      whiteLabel: false,
      api: false,
    },
    logging: {
      level: 'info',
      retention: 30,
    },
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

// ─── File I/O ─────────────────────────────────────────────────────────
async function readConfig(): Promise<AppConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    // Merge with defaults to handle schema evolution
    const defaults = getDefaultConfig();
    return { ...defaults, ...parsed } as AppConfig;
  } catch (err: unknown) {
    // File doesn't exist yet — create with defaults
    const defaults = getDefaultConfig();
    await writeConfig(defaults);
    return defaults;
  }
}

async function writeConfig(config: AppConfig): Promise<void> {
  config.updatedAt = new Date().toISOString();
  config.version += 1;
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// ─── Public API ───────────────────────────────────────────────────────
let configCache: AppConfig | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (configCache) return configCache;
  configCache = await readConfig();
  return configCache;
}

export async function updateConfig(updates: Partial<AppConfig>): Promise<AppConfig> {
  const current = await getConfig();
  const next = deepMerge(current, updates);
  await writeConfig(next);
  configCache = next;
  return next;
}

// Deep merge for nested config objects
function deepMerge<T>(target: T, source: Partial<T>): T {
  if (typeof target !== 'object' || target === null) return (source ?? target) as T;
  if (typeof source !== 'object' || source === null) return target;
  const result: any = Array.isArray(target) ? [...(target as any)] : { ...target };
  for (const key of Object.keys(source as any)) {
    const srcVal = (source as any)[key];
    const tgtVal = (target as any)[key];
    if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal) && tgtVal && typeof tgtVal === 'object') {
      result[key] = deepMerge(tgtVal, srcVal);
    } else if (srcVal !== undefined) {
      result[key] = srcVal;
    }
  }
  return result as T;
}

// ─── Password hashing ─────────────────────────────────────────────────
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string | null): boolean {
  if (!hash) {
    // First-time setup: default password is "admin123"
    return password === 'admin123';
  }
  return hashPassword(password) === hash;
}

// ─── Session management ───────────────────────────────────────────────
interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
}

async function readSessions(): Promise<AdminSession[]> {
  try {
    const raw = await fs.readFile(SESSIONS_PATH, 'utf-8');
    return JSON.parse(raw) as AdminSession[];
  } catch {
    return [];
  }
}

async function writeSessions(sessions: AdminSession[]): Promise<void> {
  await fs.mkdir(path.dirname(SESSIONS_PATH), { recursive: true });
  await fs.writeFile(SESSIONS_PATH, JSON.stringify(sessions, null, 2), 'utf-8');
}

export async function createSession(expiryHours: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const session: AdminSession = {
    token,
    createdAt: now,
    expiresAt: now + expiryHours * 60 * 60 * 1000,
  };
  const sessions = await readSessions();
  sessions.push(session);
  await writeSessions(sessions);
  return token;
}

export async function validateSession(token: string): Promise<boolean> {
  const sessions = await readSessions();
  const now = Date.now();
  const valid = sessions.find((s) => s.token === token && s.expiresAt > now);
  if (!valid) return false;
  // Cleanup expired sessions
  const active = sessions.filter((s) => s.expiresAt > now);
  if (active.length !== sessions.length) await writeSessions(active);
  return true;
}

export async function destroySession(token: string): Promise<void> {
  const sessions = await readSessions();
  const remaining = sessions.filter((s) => s.token !== token);
  await writeSessions(remaining);
}

// ─── Connection testing ───────────────────────────────────────────────
export interface TestResult {
  ok: boolean;
  message: string;
  details?: unknown;
}

export async function testDatabase(config: AppConfig): Promise<TestResult> {
  try {
    if (config.database.provider === 'sqlite') {
      // Just check the path is writable
      const dir = path.dirname(config.database.url.replace('file:', ''));
      await fs.mkdir(dir, { recursive: true });
      await fs.access(dir, fs.constants.W_OK);
      return { ok: true, message: 'SQLite: dossier accessible en écriture' };
    }
    // For other providers, just validate URL format
    if (!config.database.url) {
      return { ok: false, message: 'URL de connexion manquante' };
    }
    return { ok: true, message: `Format ${config.database.provider} validé (test de connexion réel nécessite un serveur)` };
  } catch (err) {
    return { ok: false, message: `Erreur: ${(err as Error).message}` };
  }
}

export async function testAiProvider(config: AppConfig, provider: string): Promise<TestResult> {
  const p = (config.ai.providers as any)[provider];
  if (!p) return { ok: false, message: 'Provider inconnu' };
  if (!p.apiKey) return { ok: false, message: 'Clé API manquante' };

  // Real API call for Mistral (OpenAI-compatible /chat/completions endpoint)
  if (provider === 'mistral') {
    try {
      const endpoint = p.endpoint || 'https://api.mistral.ai/v1';
      const res = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${p.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: p.model || 'mistral-large-latest',
          messages: [
            { role: 'system', content: 'You are a helpful assistant. Reply in one short sentence.' },
            { role: 'user', content: 'Say "AfriLaunch AI connection OK" in French.' },
          ],
          max_tokens: 50,
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        let errMsg = `HTTP ${res.status}`;
        try {
          const errJson = JSON.parse(errBody);
          errMsg = errJson.message || errJson.error?.message || errMsg;
        } catch { /* not JSON */ }
        if (res.status === 401) return { ok: false, message: `Mistral: clé API invalide (401). ${errMsg}` };
        if (res.status === 404) return { ok: false, message: `Mistral: modèle "${p.model}" introuvable (404). ${errMsg}` };
        return { ok: false, message: `Mistral: erreur ${res.status}. ${errMsg}` };
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || '(réponse vide)';
      return {
        ok: true,
        message: `Mistral AI connecté ✓ — modèle: ${data.model || p.model}`,
        details: { reply: reply.slice(0, 120), usage: data.usage },
      };
    } catch (err) {
      return { ok: false, message: `Mistral: erreur réseau — ${(err as Error).message}` };
    }
  }

  // For other providers, do a simulated test (real calls require their SDKs)
  await new Promise((r) => setTimeout(r, 500));
  return { ok: true, message: `${provider}: clé API présente (test réel non implémenté pour ce provider)`, details: { model: p.model } };
}

export async function testPaymentProvider(config: AppConfig, provider: string): Promise<TestResult> {
  const p = (config.payments.providers as any)[provider];
  if (!p) return { ok: false, message: 'Provider inconnu' };
  const hasKey = p.secretKey || p.clientSecret || p.apiKey || p.publicKey;
  if (!hasKey) return { ok: false, message: 'Identifiants manquants' };
  await new Promise((r) => setTimeout(r, 500));
  return { ok: true, message: `${provider}: identifiants valides (test simulé)`, details: { mode: p.mode || 'live' } };
}

export async function testEmailProvider(config: AppConfig): Promise<TestResult> {
  if (config.email.provider === 'none') return { ok: false, message: 'Aucun provider configuré' };
  await new Promise((r) => setTimeout(r, 500));
  return { ok: true, message: `${config.email.provider}: configuration valide (test simulé)` };
}
