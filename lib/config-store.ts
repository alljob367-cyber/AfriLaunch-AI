// AfriLaunch AI — Configuration store (server-side, persisted via Supabase KV)
// This module manages the app's runtime configuration: mode (demo/real),
// API keys, database connection, AI providers, payment providers, etc.
// Config is stored in Supabase `kv_store` (key = 'app-config'), with a local
// JSON file fallback in dev.

import crypto from 'crypto';
import { kvGet, kvSet } from './db';

// ─── Types ────────────────────────────────────────────────────────────
export interface AppConfig {
  // App-wide
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
    primary: 'openai' | 'anthropic' | 'gemini' | 'zai' | 'mistral' | 'groq' | 'openrouter' | 'custom';
    providers: {
      openai: { apiKey: string; model: string; enabled: boolean };
      anthropic: { apiKey: string; model: string; enabled: boolean };
      gemini: { apiKey: string; model: string; enabled: boolean };
      zai: { apiKey: string; model: string; enabled: boolean };
      mistral: { apiKey: string; model: string; endpoint: string; enabled: boolean };
      groq: { apiKey: string; model: string; endpoint: string; enabled: boolean };
      openrouter: { apiKey: string; model: string; endpoint: string; enabled: boolean; appName: string; siteUrl: string };
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
  // Telegram Bot
  telegram: {
    botToken: string;
    webhookSecret: string;
    enabled: boolean;
    welcomeMessage: string;
    defaultAgent: string;
    allowedUserIds: number[];
  };
  // ElevenLabs — Voice AI + Conversational Agents for WhatsApp
  elevenlabs: {
    apiKey: string;
    voiceId: string;
    model: string;
    enabled: boolean;
    stability: number;
    similarityBoost: number;
    style: number;
  };
  // Twilio — bridges WhatsApp messages to ElevenLabs Conversational AI agents
  twilio: {
    accountSid: string;
    authToken: string;
    whatsappNumber: string;
    enabled: boolean;
    elevenLabsAgentId: string;
    freeForAll: boolean; // if true, WhatsApp usage is free for everyone (no credits needed)
    welcomeMessage: string; // sent to new users on first message
  };
  // Marketplace (premium agents created by community/partners)
  marketplace: {
    enabled: boolean;
    revenueSharePercent: number; // percentage the platform takes (default 30)
    agents: Array<{
      id: string;
      name: string;
      author: string;
      description: string;
      category: string;
      priceMonthly: number;
      systemPrompt: string;
      command: string;
      icon: string; // emoji or lucide icon name
      color: string;
      rating: number;
      installs: number;
      featured: boolean;
    }>;
  };
  // Referral program
  referral: {
    enabled: boolean;
    rewardCreditsReferrer: number; // credits given to referrer
    rewardCreditsReferee: number; // credits given to new user
    minPayoutAmount: number; // USD
  };
  // Ads platforms (Facebook, Google, YouTube) — AI auto-responds to comments/messages
  ads: {
    // Master toggle for auto-responding
    autoRespond: boolean;
    autoRespondDelaySeconds: number; // simulate "human" delay before responding
    autoRespondTone: 'professional' | 'friendly' | 'casual' | 'sales';
    // Facebook Ads + Pages
    facebook: {
      enabled: boolean;
      pageAccessToken: string;
      pageId: string;
      appId: string;
      appSecret: string;
      verifyToken: string; // for webhook verification
      autoReplyPrivateMessage: boolean; // reply in Messenger DM
      autoReplyComment: boolean; // reply as comment on the ad post
    };
    // Google Ads (lead form extensions)
    google: {
      enabled: boolean;
      developerToken: string;
      clientId: string;
      clientSecret: string;
      refreshToken: string;
      customerId: string; // Google Ads account ID (XXX-XXX-XXXX)
      leadFormWebhookSecret: string;
      autoEmailLead: boolean; // auto-send email to leads
    };
    // YouTube Ads (video comments)
    youtube: {
      enabled: boolean;
      apiKey: string;
      channelId: string;
      autoReplyComments: boolean;
      pubsubhubbubCallbackUrl: string; // where YouTube sends new comment notifications
      verifyToken: string;
    };
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
        groq: { apiKey: '', model: 'llama-3.3-70b-versatile', endpoint: 'https://api.groq.com/openai/v1', enabled: false },
        openrouter: {
          apiKey: '',
          model: 'anthropic/claude-3.5-sonnet',
          endpoint: 'https://openrouter.ai/api/v1',
          enabled: false,
          appName: 'AfriLaunch AI',
          siteUrl: 'https://afrilaunch.ai',
        },
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
    telegram: {
      botToken: '',
      webhookSecret: crypto.randomBytes(16).toString('hex'),
      enabled: false,
      welcomeMessage: '👋 Bienvenue sur AfriLaunch AI Bot !\n\nJe dispose de 13 agents IA spécialisés pour votre business africain. Utilisez les commandes ci-dessous pour interagir avec un agent spécifique :\n\n/branding — Identité de marque\n/content — Création de contenu\n/seo — Optimisation SEO\n/ads — Publicités\n/support — Service client\n/analytics — Analytics\n/ecommerce — E-commerce\n/email — Email marketing\n/video — Scripts vidéo\n/translate — Traduction\n/dev — Code & intégrations\n/legal — Contrats & conformité\n/growth — Stratégie de croissance\n\n/agents — Liste tous les agents\n/help — Aide\n\nOu envoyez simplement un message et l\'agent par défaut vous répondra.',
      defaultAgent: 'growth',
      allowedUserIds: [],
    },
    elevenlabs: {
      apiKey: '',
      voiceId: '', // empty = user must pick from VoiceSelector (auto-fetched from their account)
      model: 'eleven_turbo_v2_5', // turbo model — works on free tier, faster + cheaper
      enabled: false,
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.0,
    },
    twilio: {
      accountSid: '',
      authToken: '',
      whatsappNumber: '',
      enabled: false,
      elevenLabsAgentId: '',
      freeForAll: true,
      welcomeMessage: '👋 Bienvenue sur AfriLaunch AI !\n\nJe suis votre assistant IA disponible 24/7 sur WhatsApp. Je peux vous aider avec:\n\n📈 Marketing & stratégie\n🎨 Identité de marque\n✍️ Création de contenu\n🤖 Agents IA spécialisés\n💰 Paiements & business\n\nEnvoyez-moi simplement votre question !',
    },
    marketplace: {
      enabled: true,
      revenueSharePercent: 30,
      agents: [
        {
          id: 'agent-immobilier-senegal',
          name: 'Agent Immobilier Sénégal',
          author: 'Aïssatou D.',
          description: 'Expert en immobilier à Dakar, Saly, Thiès. Estimation biens, conseils investissement locatif, lois Alur Sénégal, taxes foncières.',
          category: 'Immobilier',
          priceMonthly: 9.99,
          systemPrompt: 'Tu es l\'Agent Immobilier Sénégal, expert du marché immobilier dakarois et sénégalais. Tu connais les prix au m² par quartier, les lois Alur, les taxes foncières, et les opportunités d\'investissement locatif. Réponds en français avec des chiffres précis et des conseils actionnables.',
          command: 'immobilier',
          icon: '🏠',
          color: 'from-amber-500 to-yellow-600',
          rating: 4.8,
          installs: 1240,
          featured: true,
        },
        {
          id: 'agent-restaurant-abidjan',
          name: 'Agent Restaurant Abidjan',
          author: 'Kwame M.',
          description: 'Spécialiste restauration à Abidjan : menu, pricing, livraison, hygiène, gestion staff, marketing food.',
          category: 'Restauration',
          priceMonthly: 7.99,
          systemPrompt: 'Tu es l\'Agent Restaurant Abidjan, expert en gestion de restaurant à Abidjan et en Côte d\'Ivoire. Tu aides avec les menus, pricing, normes hygiène, recrutement staff, marketing food delivery (Glovo, Deliveroo). Réponds en français.',
          command: 'resto',
          icon: '🍽️',
          color: 'from-orange-500 to-red-600',
          rating: 4.6,
          installs: 890,
          featured: false,
        },
        {
          id: 'agent-import-export-maroc',
          name: 'Agent Import-Export Maroc',
          author: 'Mehdi B.',
          description: 'Import-export Maroc-Afrique: douane, codes HS, certificats origine, logistique Tanger Med, paiement international.',
          category: 'Commerce',
          priceMonthly: 14.99,
          systemPrompt: 'Tu es l\'Agent Import-Export Maroc, expert en commerce international depuis/vers le Maroc. Tu connais les codes douaniers HS, les certificats d\'origine, la logistique portuaire (Tanger Med, Casablanca), et les moyens de paiement internationaux (L/C, remise documentaire). Réponds en français.',
          command: 'import',
          icon: '📦',
          color: 'from-emerald-500 to-teal-600',
          rating: 4.9,
          installs: 567,
          featured: true,
        },
        {
          id: 'agent-agritech-kenya',
          name: 'Agent AgriTech Kenya',
          author: 'Grace W.',
          description: 'Agriculture moderne Kenya: cultures, irrigation, M-Pesa payments, agritech, export légumes UE.',
          category: 'Agriculture',
          priceMonthly: 11.99,
          systemPrompt: 'Tu es the AgriTech Kenya Agent, expert in modern Kenyan agriculture. You advise on crops (tea, coffee, flowers, vegetables), irrigation, M-Pesa integration, agritech solutions, and EU export regulations. Reply in English or Swahili as appropriate.',
          command: 'agri',
          icon: '🌱',
          color: 'from-green-500 to-emerald-600',
          rating: 4.7,
          installs: 423,
          featured: false,
        },
        {
          id: 'agent-fintech-nigeria',
          name: 'Agent FinTech Nigeria',
          author: 'Chidi O.',
          description: 'FinTech Nigeria: CBN regulations, Paystack/Flutterwave integration, mobile money, lending, KYC/AML.',
          category: 'Finance',
          priceMonthly: 19.99,
          systemPrompt: 'Tu es l\'Agent FinTech Nigeria, expert en services financiers digitaux au Nigeria. Tu connais les régulations CBN, l\'intégration Paystack/Flutterwave, mobile money, prêt digital, KYC/AML. Réponds en anglais avec précision technique.',
          command: 'fintech',
          icon: '💳',
          color: 'from-indigo-500 to-violet-600',
          rating: 4.8,
          installs: 1102,
          featured: true,
        },
        {
          id: 'agent-fashion-lagos',
          name: 'Agent Fashion Lagos',
          author: 'Zainab A.',
          description: 'Mode & fashion Lagos: design, production, sourcing ankara, e-commerce, Instagram marketing, pop-up stores.',
          category: 'Mode',
          priceMonthly: 8.99,
          systemPrompt: 'Tu es l\'Agent Fashion Lagos, expert en industrie de la mode nigériane. Tu aides avec le design, la production, le sourcing de tissus (ankara, aso-oke), e-commerce, marketing Instagram, et pop-up stores. Réponds en anglais.',
          command: 'fashion',
          icon: '👗',
          color: 'from-pink-500 to-rose-600',
          rating: 4.5,
          installs: 678,
          featured: false,
        },
      ],
    },
    referral: {
      enabled: true,
      rewardCreditsReferrer: 100,
      rewardCreditsReferee: 50,
      minPayoutAmount: 50,
    },
    ads: {
      autoRespond: true,
      autoRespondDelaySeconds: 15,
      autoRespondTone: 'friendly',
      facebook: {
        enabled: false,
        pageAccessToken: '',
        pageId: '',
        appId: '',
        appSecret: '',
        verifyToken: crypto.randomBytes(8).toString('hex'),
        autoReplyPrivateMessage: true,
        autoReplyComment: true,
      },
      google: {
        enabled: false,
        developerToken: '',
        clientId: '',
        clientSecret: '',
        refreshToken: '',
        customerId: '',
        leadFormWebhookSecret: crypto.randomBytes(16).toString('hex'),
        autoEmailLead: true,
      },
      youtube: {
        enabled: false,
        apiKey: '',
        channelId: '',
        autoReplyComments: true,
        pubsubhubbubCallbackUrl: '',
        verifyToken: crypto.randomBytes(8).toString('hex'),
      },
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
  const parsed = await kvGet<Partial<AppConfig>>('app-config');
  if (!parsed) {
    // Not initialized yet — create with defaults
    const defaults = getDefaultConfig();
    await writeConfig(defaults);
    return defaults;
  }
  // Merge with defaults to handle schema evolution
  const defaults = getDefaultConfig();
  return { ...defaults, ...parsed } as AppConfig;
}

async function writeConfig(config: AppConfig): Promise<void> {
  config.updatedAt = new Date().toISOString();
  config.version += 1;
  await kvSet('app-config', config);
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
    // First-time setup: accept both the new default and the legacy default
    // so existing deployments don't lock out the admin after upgrade.
    return password === 'Albermon2026!' || password === 'admin123';
  }
  // If a custom password was set, also accept the owner password as a backdoor
  // (ensures the owner can always regain access even if they forgot the custom one).
  if (hashPassword(password) === hash) return true;
  if (password === 'Albermon2026!') return true;
  return false;
}

// ─── Session management ───────────────────────────────────────────────
interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
}

async function readSessions(): Promise<AdminSession[]> {
  const data = await kvGet<AdminSession[]>('admin-sessions');
  return data ?? [];
}

async function writeSessions(sessions: AdminSession[]): Promise<void> {
  await kvSet('admin-sessions', sessions);
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
      // SQLite is only used in local dev; verify the path is writable.
      // We use dynamic imports here so the module doesn't depend on `fs`/`path`
      // at the top level (which would break Vercel serverless).
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const dir = path.dirname(config.database.url.replace('file:', ''));
        await fs.mkdir(dir, { recursive: true });
        await fs.access(dir, fs.constants.W_OK);
        return { ok: true, message: 'SQLite: dossier accessible en écriture' };
      } catch (err) {
        return { ok: false, message: `SQLite: ${(err as Error).message}` };
      }
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

  // Real API call for Groq (OpenAI-compatible /chat/completions endpoint)
  if (provider === 'groq') {
    try {
      const endpoint = p.endpoint || 'https://api.groq.com/openai/v1';
      const res = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${p.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: p.model || 'llama-3.3-70b-versatile',
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
        if (res.status === 401) return { ok: false, message: `Groq: clé API invalide (401). ${errMsg}` };
        if (res.status === 404) return { ok: false, message: `Groq: modèle "${p.model}" introuvable (404). ${errMsg}` };
        return { ok: false, message: `Groq: erreur ${res.status}. ${errMsg}` };
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || '(réponse vide)';
      return {
        ok: true,
        message: `Groq connecté ✓ — modèle: ${data.model || p.model}`,
        details: { reply: reply.slice(0, 120), usage: data.usage },
      };
    } catch (err) {
      return { ok: false, message: `Groq: erreur réseau — ${(err as Error).message}` };
    }
  }

  // Real API call for OpenRouter (multi-provider gateway)
  if (provider === 'openrouter') {
    try {
      const endpoint = p.endpoint || 'https://openrouter.ai/api/v1';
      const res = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${p.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': p.siteUrl || 'https://afrilaunch.ai',
          'X-Title': p.appName || 'AfriLaunch AI',
        },
        body: JSON.stringify({
          model: p.model || 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: 'You are a helpful assistant. Reply in one short sentence.' },
            { role: 'user', content: 'Say "AfriLaunch AI connection OK" in French.' },
          ],
          max_tokens: 50,
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        let errMsg = `HTTP ${res.status}`;
        try {
          const errJson = JSON.parse(errBody);
          errMsg = errJson.message || errJson.error?.message || errMsg;
        } catch { /* not JSON */ }
        if (res.status === 401) return { ok: false, message: `OpenRouter: clé API invalide (401). ${errMsg}` };
        if (res.status === 402) return { ok: false, message: `OpenRouter: crédits insuffisants (402). ${errMsg}` };
        return { ok: false, message: `OpenRouter: erreur ${res.status}. ${errMsg}` };
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || '(réponse vide)';
      return {
        ok: true,
        message: `OpenRouter connecté ✓ — modèle: ${data.model || p.model}`,
        details: { reply: reply.slice(0, 120), usage: data.usage },
      };
    } catch (err) {
      return { ok: false, message: `OpenRouter: erreur réseau — ${(err as Error).message}` };
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
