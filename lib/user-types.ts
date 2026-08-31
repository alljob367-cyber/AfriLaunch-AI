// AfriLaunch AI — User types and plan definitions (client-safe, no fs/crypto)
// This file can be imported by both client and server components.

export type PlanId = 'starter' | 'pro' | 'business' | 'enterprise';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  passwordHash?: string; // server-only, stripped before sending to client
  createdAt: string;
  plan: PlanId;
  planStatus: 'active' | 'canceled' | 'past_due' | 'trialing' | 'pending_payment';
  planStartedAt: string | null;
  planEndsAt: string | null;
  stripeCustomerId?: string;
  credits: number;
  creditsUsedThisMonth: number;
  creditsResetAt: string;
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  referralCreditsEarned: number;
  telegramUserId?: number;
  telegramUsername?: string;
  telegramLinkedAt?: string;
  installedAgents: string[];
  lastLoginAt: string | null;
  updatedAt: string;
  isAdmin?: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  creditsPerMonth: number;
  features: string[];
  popular?: boolean;
  botType: 'shared' | 'dedicated';
  whiteLabel: boolean;
  maxTeamMembers: number;
  apiAccess: boolean;
}

export interface CreditPack {
  id: string;
  credits: number;
  price: number;
  discount: number;
  popular?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter', name: 'Starter', priceMonthly: 5000, priceAnnual: 48000, creditsPerMonth: 500,
    features: ['500 crédits IA / mois', '2 organisations', '13 agents IA + marketplace', 'Bot Telegram partagé', '3 agents IA en parallèle', 'Planification de contenu', 'Support email 48h'],
    botType: 'shared', whiteLabel: false, maxTeamMembers: 1, apiAccess: false,
  },
  pro: {
    id: 'pro', name: 'Pro', priceMonthly: 15000, priceAnnual: 144000, creditsPerMonth: 5000,
    features: ['5 000 crédits IA / mois', '5 organisations', 'Tous les agents IA + marketplace', 'Bot Telegram dédié (votre token)', 'Campagnes marketing IA', 'Analytics avancés', 'Accès API limité', 'Support prioritaire 24h'],
    popular: true, botType: 'dedicated', whiteLabel: false, maxTeamMembers: 5, apiAccess: true,
  },
  business: {
    id: 'business', name: 'Business', priceMonthly: 50000, priceAnnual: 480000, creditsPerMonth: 50000,
    features: ['50 000 crédits IA / mois', 'Organisations illimitées', 'Tous les agents + marketplace premium', 'Bot Telegram white-label', 'Marque blanche disponible', 'Intégrations CRM', 'Analytics avancés', 'Manager de compte dédié', 'SLA 99.9%', 'Accès API complet'],
    botType: 'dedicated', whiteLabel: true, maxTeamMembers: 20, apiAccess: true,
  },
  enterprise: {
    id: 'enterprise', name: 'Enterprise', priceMonthly: 150000, priceAnnual: 1440000, creditsPerMonth: -1,
    features: ['Crédits illimités', 'Organisations illimitées', 'Déploiement sur site', 'SLA personnalisé', 'Intégrations sur mesure', 'Formation personnalisée', 'Support 24/7 dédié'],
    botType: 'dedicated', whiteLabel: true, maxTeamMembers: -1, apiAccess: true,
  },
};

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack_1000', credits: 1000, price: 2500, discount: 0 },
  { id: 'pack_5000', credits: 5000, price: 10000, discount: 20, popular: true },
  { id: 'pack_25000', credits: 25000, price: 45000, discount: 30 },
  { id: 'pack_100000', credits: 100000, price: 150000, discount: 40 },
];

// ─── Action costs (variable credits per action) ──────────────────────
// Centralized so all modules use the same cost model. One "credit" ≈
// a small AI action (~800 tokens in/out via Groq/Gemini Flash).
// More complex actions cost more credits to reflect the real LLM cost.
//
// Pricing rationale (per action, in FCFA at Pro plan rates):
//   1 credit  ≈ 0.5 FCFA  (chat court, WhatsApp, social post via Groq/Gemini Flash)
//   3 credits ≈ 1.5 FCFA  (content batch, content unique via GPT-4o-mini)
//   5 credits ≈ 5 FCFA    (branding kit JSON via DeepSeek V3 / GPT-4o)
//   10 credits ≈ 15 FCFA  (site web complet via Claude Sonnet / DeepSeek V3)
//   15 credits ≈ 25 FCFA  (brand kit visuel avec images générées)
//   20 credits ≈ 40 FCFA  (media kit complet 6 bannières)
//   30 credits ≈ 80 FCFA  (voice generation ElevenLabs longue)
//
// At Pro plan (15 000 FCFA / 5 000 credits), the user gets ~5 000 simple
// actions OR ~500 branding kits OR ~50 full websites — sustainable margin.
export type ActionType =
  | 'chat'                // 1 credit — chat court, WhatsApp Agent, agent métier
  | 'content'             // 1 credit — 1 post/script/flyer (single)
  | 'content_batch'       // 3 credits — 3 variants
  | 'identity'            // 5 credits — JSON branding kit (text only)
  | 'website'             // 10 credits — site web complet HTML/CSS
  | 'brand_kit_visual'    // 15 credits — brand kit avec images (logo + palettes + mockups)
  | 'media_kit'           // 20 credits — media kit complet (6 bannières + visuels)
  | 'voice_short'         // 5 credits — voice generation ≤30s (ElevenLabs)
  | 'voice_long'          // 30 credits — voice generation >30s (ElevenLabs)
  | 'youtube_content'     // 3 credits — génération script + metadata YouTube
  | 'youtube_upload'      // 0 credits — upload vidéo (pas d'IA, juste storage)
  | 'youtube_publish'     // 0 credits — publication YouTube (API call only)
  | 'social_publish'      // 0 credits — publication 1 réseau (API call only)
  | 'social_schedule'     // 0 credits — planification (API call only)
  | 'agent_action'        // 1 credit — action d'un agent IA (SEO audit, Ads optimize, etc.)
  | 'image_gen'           // 3 credits — génération d'1 image (logo, illustration)
  | 'analytics_report';   // 5 credits — rapport analytics complet

export const ACTION_CREDITS: Record<ActionType, number> = {
  chat: 1,
  content: 1,
  content_batch: 3,
  identity: 5,
  website: 10,
  brand_kit_visual: 15,
  media_kit: 20,
  voice_short: 5,
  voice_long: 30,
  youtube_content: 3,
  youtube_upload: 0,
  youtube_publish: 0,
  social_publish: 0,
  social_schedule: 0,
  agent_action: 1,
  image_gen: 3,
  analytics_report: 5,
};

// Helper: get the credit cost for an action type
export function getActionCost(action: ActionType): number {
  return ACTION_CREDITS[action] ?? 1;
}

// Format a price in FCFA (West African CFA franc)
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

export function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _ph, ...rest } = user as User & { passwordHash?: string };
  return rest;
}
