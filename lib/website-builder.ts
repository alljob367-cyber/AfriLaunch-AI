// AfriLaunch AI — Website Builder store
// User configures business type, services, pricing, reservation settings
// → system assembles a functional HTML site from pre-built templates
// → AI generates ONLY the marketing copy (descriptions, taglines)
//
// This replaces the old "generate everything in one prompt" approach
// with a structured, module-by-module builder that guarantees:
//   - Functional reservation button (WhatsApp deep link)
//   - Real user data (services, prices, contact)
//   - Business-type-specific templates
//   - Consistent quality every time

import { kvGet, kvSet } from './db';

export type BusinessType = 'restaurant' | 'hotel' | 'ecommerce' | 'salon' | 'clinic' | 'business' | 'portfolio';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: string;       // "25 000 FCFA" — free text
  category?: string;   // "Plats", "Chambres", "Services"...
  imageEmoji?: string; // emoji used as visual
}

export interface ReservationConfig {
  enabled: boolean;
  type: 'whatsapp' | 'form' | 'phone' | 'email';
  // WhatsApp
  whatsappNumber?: string;
  // Phone
  phoneNumber?: string;
  // Email
  email?: string;
  // Form fields to collect
  fields: string[]; // ['name', 'phone', 'date', 'time', 'guests', 'message']
  // Button text
  buttonText: string;
}

export interface WebsiteConfig {
  id: string;
  userId: string;
  // Business type — determines template
  businessType: BusinessType;
  // Business info
  businessName: string;
  tagline: string;
  description: string;
  industry: string;
  country: string;
  // Visual
  primaryColor: string;
  // Services / Products
  services: ServiceItem[];
  // Pricing plans (for business/portfolio types)
  pricingPlans: Array<{
    name: string;
    price: string;
    features: string[];
    popular?: boolean;
  }>;
  // Reservation / Booking
  reservation: ReservationConfig;
  // Contact
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  contactWhatsApp: string;
  // Social
  socialInstagram?: string;
  socialFacebook?: string;
  socialTikTok?: string;
  // Gallery (emojis or URLs)
  gallery: Array<{ emoji: string; caption: string }>;
  // Generated HTML (cached)
  generatedHtml?: string;
  generatedAt?: number;
  // Meta
  createdAt: number;
  updatedAt: number;
}

const KEY = 'website-builder-configs';
const MAX_PER_USER = 20;

async function readStore(): Promise<{ configs: WebsiteConfig[] }> {
  const s = await kvGet<{ configs: WebsiteConfig[] }>(KEY);
  return s ?? { configs: [] };
}

async function writeStore(s: { configs: WebsiteConfig[] }): Promise<void> {
  // LRU per user
  const byUser = new Map<string, WebsiteConfig[]>();
  for (const c of s.configs) {
    if (!byUser.has(c.userId)) byUser.set(c.userId, []);
    byUser.get(c.userId)!.push(c);
  }
  for (const [userId, configs] of byUser) {
    if (configs.length > MAX_PER_USER) {
      configs.sort((a, b) => b.updatedAt - a.updatedAt);
      const toRemove = new Set(configs.slice(MAX_PER_USER).map((c) => c.id));
      s.configs = s.configs.filter((c) => !(c.userId === userId && toRemove.has(c.id)));
    }
  }
  await kvSet(KEY, s);
}

export function getDefaultConfig(userId: string): WebsiteConfig {
  return {
    id: 'wb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    userId,
    businessType: 'restaurant',
    businessName: '',
    tagline: '',
    description: '',
    industry: '',
    country: 'Cameroun',
    primaryColor: '#6366f1',
    services: [],
    pricingPlans: [],
    reservation: {
      enabled: true,
      type: 'whatsapp',
      fields: ['name', 'phone', 'date', 'time', 'guests'],
      buttonText: 'Réserver',
    },
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
    contactWhatsApp: '',
    gallery: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export async function getUserConfigs(userId: string): Promise<WebsiteConfig[]> {
  const s = await readStore();
  return s.configs
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getConfig(id: string): Promise<WebsiteConfig | null> {
  const s = await readStore();
  return s.configs.find((c) => c.id === id) ?? null;
}

export async function upsertConfig(config: WebsiteConfig): Promise<WebsiteConfig> {
  const s = await readStore();
  const idx = s.configs.findIndex((c) => c.id === config.id);
  config.updatedAt = Date.now();
  if (idx >= 0) {
    s.configs[idx] = config;
  } else {
    s.configs.push(config);
  }
  await writeStore(s);
  return config;
}

export async function deleteConfig(userId: string, id: string): Promise<boolean> {
  const s = await readStore();
  const before = s.configs.length;
  s.configs = s.configs.filter((c) => !(c.id === id && c.userId === userId));
  if (s.configs.length === before) return false;
  await writeStore(s);
  return true;
}

// ─── Business type metadata ────────────────────────────────────────────
export const BUSINESS_TYPES: Array<{
  type: BusinessType;
  label: string;
  emoji: string;
  description: string;
  defaultServices: string[];
  defaultFields: string[];
  hasPricing: boolean;
  hasGallery: boolean;
}> = [
  {
    type: 'restaurant',
    label: 'Restaurant',
    emoji: '🍽️',
    description: 'Menu, réservation de table, galerie de plats',
    defaultServices: ['Plats principaux', 'Boissons', 'Desserts'],
    defaultFields: ['name', 'phone', 'date', 'time', 'guests'],
    hasPricing: false,
    hasGallery: true,
  },
  {
    type: 'hotel',
    label: 'Hôtel',
    emoji: '🏨',
    description: 'Types de chambres, réservation, équipements',
    defaultServices: ['Chambre Simple', 'Chambre Double', 'Suite'],
    defaultFields: ['name', 'phone', 'date', 'nights', 'guests'],
    hasPricing: false,
    hasGallery: true,
  },
  {
    type: 'ecommerce',
    label: 'E-commerce',
    emoji: '🛒',
    description: 'Produits, prix, commande WhatsApp',
    defaultServices: ['Produits populaires'],
    defaultFields: ['name', 'phone', 'product', 'quantity'],
    hasPricing: false,
    hasGallery: true,
  },
  {
    type: 'salon',
    label: 'Salon / Spa',
    emoji: '💅',
    description: 'Prestations, rendez-vous, équipe',
    defaultServices: ['Coupe', 'Coloration', 'Soin', 'Manucure'],
    defaultFields: ['name', 'phone', 'date', 'time', 'service'],
    hasPricing: false,
    hasGallery: false,
  },
  {
    type: 'clinic',
    label: 'Clinique',
    emoji: '🏥',
    description: 'Consultations, rendez-vous, spécialités',
    defaultServices: ['Consultation générale', 'Spécialiste', 'Urgences'],
    defaultFields: ['name', 'phone', 'date', 'time', 'service'],
    hasPricing: false,
    hasGallery: false,
  },
  {
    type: 'business',
    label: 'Business',
    emoji: '🏢',
    description: 'Services, tarifs, contact, devis',
    defaultServices: ['Consultation', 'Formation', 'Accompagnement'],
    defaultFields: ['name', 'phone', 'service', 'message'],
    hasPricing: true,
    hasGallery: false,
  },
  {
    type: 'portfolio',
    label: 'Portfolio',
    emoji: '🎨',
    description: 'Réalisations, à propos, contact',
    defaultServices: [],
    defaultFields: ['name', 'phone', 'message'],
    hasPricing: false,
    hasGallery: true,
  },
];

export function getBusinessTypeInfo(type: BusinessType) {
  return BUSINESS_TYPES.find((b) => b.type === type) ?? BUSINESS_TYPES[0];
}

// ─── Field labels ──────────────────────────────────────────────────────
export const FIELD_LABELS: Record<string, { label: string; placeholder: string; type: string }> = {
  name: { label: 'Nom complet', placeholder: 'Votre nom', type: 'text' },
  phone: { label: 'Téléphone', placeholder: '+237 6XX XXX XXX', type: 'tel' },
  email: { label: 'Email', placeholder: 'vous@email.com', type: 'email' },
  date: { label: 'Date', placeholder: '', type: 'date' },
  time: { label: 'Heure', placeholder: '', type: 'time' },
  guests: { label: 'Nombre de personnes', placeholder: '2', type: 'number' },
  nights: { label: 'Nombre de nuits', placeholder: '1', type: 'number' },
  service: { label: 'Service souhaité', placeholder: '', type: 'select' },
  product: { label: 'Produit', placeholder: '', type: 'text' },
  quantity: { label: 'Quantité', placeholder: '1', type: 'number' },
  message: { label: 'Message', placeholder: 'Votre message...', type: 'textarea' },
};
