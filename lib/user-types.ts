// AfriLaunch AI — User types and plan definitions (client-safe, no fs/crypto)
// This file can be imported by both client and server components.

export type PlanId = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  passwordHash?: string; // server-only, stripped before sending to client
  createdAt: string;
  plan: PlanId;
  planStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
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
  free: {
    id: 'free', name: 'Free', priceMonthly: 0, priceAnnual: 0, creditsPerMonth: 50,
    features: ['50 crédits IA / mois', '1 organisation', 'Accès aux 13 agents IA de base', 'Bot Telegram partagé', 'Support communauté'],
    botType: 'shared', whiteLabel: false, maxTeamMembers: 1, apiAccess: false,
  },
  starter: {
    id: 'starter', name: 'Starter', priceMonthly: 9.99, priceAnnual: 95.90, creditsPerMonth: 500,
    features: ['500 crédits IA / mois', '2 organisations', '13 agents IA + marketplace', 'Bot Telegram partagé', '3 agents IA en parallèle', 'Planification de contenu', 'Support email 48h'],
    botType: 'shared', whiteLabel: false, maxTeamMembers: 1, apiAccess: false,
  },
  pro: {
    id: 'pro', name: 'Pro', priceMonthly: 29.99, priceAnnual: 287.90, creditsPerMonth: 5000,
    features: ['5 000 crédits IA / mois', '5 organisations', 'Tous les agents IA + marketplace', 'Bot Telegram dédié (votre token)', 'Campagnes marketing IA', 'Analytics avancés', 'Accès API limité', 'Support prioritaire 24h'],
    popular: true, botType: 'dedicated', whiteLabel: false, maxTeamMembers: 5, apiAccess: true,
  },
  business: {
    id: 'business', name: 'Business', priceMonthly: 79.99, priceAnnual: 767.90, creditsPerMonth: 50000,
    features: ['50 000 crédits IA / mois', 'Organisations illimitées', 'Tous les agents + marketplace premium', 'Bot Telegram white-label', 'Marque blanche disponible', 'Intégrations CRM', 'Analytics avancés', 'Manager de compte dédié', 'SLA 99.9%', 'Accès API complet'],
    botType: 'dedicated', whiteLabel: true, maxTeamMembers: 20, apiAccess: true,
  },
  enterprise: {
    id: 'enterprise', name: 'Enterprise', priceMonthly: 299, priceAnnual: 2870, creditsPerMonth: -1,
    features: ['Crédits illimités', 'Organisations illimitées', 'Déploiement sur site', 'SLA personnalisé', 'Intégrations sur mesure', 'Formation personnalisée', 'Support 24/7 dédié'],
    botType: 'dedicated', whiteLabel: true, maxTeamMembers: -1, apiAccess: true,
  },
};

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack_1000', credits: 1000, price: 4.99, discount: 0 },
  { id: 'pack_5000', credits: 5000, price: 19.99, discount: 20, popular: true },
  { id: 'pack_25000', credits: 25000, price: 89.99, discount: 30 },
  { id: 'pack_100000', credits: 100000, price: 299.99, discount: 40 },
];

export function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _ph, ...rest } = user as User & { passwordHash?: string };
  return rest;
}
