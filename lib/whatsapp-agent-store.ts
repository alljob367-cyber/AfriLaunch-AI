// AfriLaunch AI — Per-user WhatsApp Agent configuration
// Each user can configure how the WhatsApp Agent responds to THEIR customers:
//   - Custom system prompt (personality, instructions)
//   - Business context (name, industry, services, pricing, contact)
//   - Tone (chaleureux / professionnel / décontracté / formel)
//   - Language (fr / en / bilingual)
//   - First message (welcome for new contacts)
//   - Business hours (when to respond immediately vs. "we'll get back to you")
//   - FAQ (predefined Q&A the agent should know)
//   - Auto-respond toggle (off = just store + notify user)
//
// The webhook looks up the config by matching the incoming WhatsApp number
// to a user's connected WhatsApp account (social-store). If no match, falls
// back to admin defaults.

import { kvGet, kvSet } from './db';

export type AgentTone = 'chaleureux' | 'professionnel' | 'decontracte' | 'formel';
export type AgentLanguage = 'fr' | 'en' | 'bilingual';

export interface BusinessHours {
  enabled: boolean;
  // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  activeDays: number[]; // e.g. [1,2,3,4,5] for Mon-Fri
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  outsideHoursMessage: string; // sent when outside business hours
}

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
}

export interface WhatsAppAgentConfig {
  userId: string;
  // Core personality
  enabled: boolean;
  agentName: string;            // e.g. "Assistant Hotel Albermon"
  systemPrompt: string;         // custom instructions (free text)
  tone: AgentTone;
  language: AgentLanguage;
  firstMessage: string;         // welcome for new contacts
  maxResponseLength: number;    // 300 / 500 / 1000 / 2000
  // Business context (auto-filled from org, editable)
  businessName: string;
  industry: string;
  country: string;
  services: string[];           // list of services/products
  pricing: string;              // quick pricing info
  contactInfo: string;          // phone/email/address to share
  // Behavior
  autoRespond: boolean;         // if false, just store + notify
  businessHours: BusinessHours;
  faq: FAQEntry[];
  // Visual product catalog — the agent can send product images + prices
  // when a customer asks about products
  catalog: CatalogProduct[];
  // AI provider selection (override load balancer default)
  aiProvider: 'auto' | 'openrouter' | 'mistral';
  // Stats
  updatedAt: number;
}

export interface CatalogProduct {
  id: string;
  name: string;           // e.g. "Chambre Double Deluxe"
  description: string;    // short description
  price: string;          // e.g. "25 000 FCFA/nuit" (free text — currency agnostic)
  imageUrl?: string;      // data URL or external URL (optional)
  category?: string;      // e.g. "Hébergement", "Restaurant", "Services"
  inStock: boolean;
  createdAt: number;
}

interface Store {
  configs: WhatsAppAgentConfig[];
}

const KEY = 'whatsapp-agent-configs';

async function readStore(): Promise<Store> {
  const s = await kvGet<Store>(KEY);
  return s ?? { configs: [] };
}

async function writeStore(s: Store): Promise<void> {
  await kvSet(KEY, s);
}

export function getDefaultConfig(userId: string): WhatsAppAgentConfig {
  return {
    userId,
    enabled: true,
    agentName: 'Assistant AfriLaunch',
    systemPrompt: '',
    tone: 'chaleureux',
    language: 'fr',
    firstMessage: 'Bonjour 👋 Je suis l\'assistant IA de {businessName}. Comment puis-je vous aider aujourd\'hui ?',
    maxResponseLength: 1000,
    businessName: '',
    industry: '',
    country: 'Afrique',
    services: [],
    pricing: '',
    contactInfo: '',
    autoRespond: true,
    businessHours: {
      enabled: false,
      activeDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
      outsideHoursMessage: 'Merci pour votre message ! Nous sommes actuellement fermés. Nous vous répondrons dès notre retour. 🌙',
    },
    faq: [],
    catalog: [],
    aiProvider: 'auto', // 'auto' = load balancer (OpenRouter → Mistral → Groq)
    updatedAt: Date.now(),
  };
}

export async function getUserConfig(userId: string): Promise<WhatsAppAgentConfig> {
  const s = await readStore();
  const cfg = s.configs.find((c) => c.userId === userId);
  return cfg ?? getDefaultConfig(userId);
}

export async function upsertUserConfig(userId: string, updates: Partial<WhatsAppAgentConfig>): Promise<WhatsAppAgentConfig> {
  const s = await readStore();
  let cfg = s.configs.find((c) => c.userId === userId);
  if (!cfg) {
    cfg = getDefaultConfig(userId);
    s.configs.push(cfg);
  }
  Object.assign(cfg, updates, { updatedAt: Date.now() });
  await writeStore(s);
  return cfg;
}

// Look up a config by the WhatsApp phone number the user connected in social-store.
// Returns null if no user has connected this WhatsApp number.
export async function getConfigByWhatsAppNumber(phoneNumber: string): Promise<WhatsAppAgentConfig | null> {
  // Normalize: strip "whatsapp:" prefix, keep digits only
  const normalized = phoneNumber.replace(/^whatsapp:/i, '').replace(/[^0-9]/g, '');
  if (!normalized) return null;

  // Import here to avoid circular dependency at module load
  const { getSocialAccounts } = await import('./social-store');
  const { kvGet } = await import('./db');

  // We need to find which user connected this WhatsApp number.
  // social-store stores all accounts in one KV key — we read it directly.
  interface SocialAccountRow { userId: string; platform: string; handle: string; connected: boolean; }
  const store = await kvGet<{ accounts: SocialAccountRow[] }>('social-accounts');
  const accounts = store?.accounts ?? [];
  const match = accounts.find(
    (a) => a.platform === 'whatsapp' && a.connected && a.handle.replace(/[^0-9]/g, '') === normalized,
  );
  if (!match) return null;

  return getUserConfig(match.userId);
}

// Build the final system prompt from the user's config + business context.
// This is what gets sent to the LLM when the agent responds.
export function buildSystemPrompt(cfg: WhatsAppAgentConfig): string {
  const parts: string[] = [];

  // Core identity
  parts.push(`Tu es "${cfg.agentName}", l'assistant WhatsApp IA de ${cfg.businessName || 'cette entreprise'}.`);

  // Tone
  const toneMap: Record<AgentTone, string> = {
    chaleureux: 'chaleureux, accueillant et proche du client',
    professionnel: 'professionnel, courtois et efficace',
    decontracte: 'décontracté, amical et direct',
    formel: 'formel, respectueux et précis',
  };
  parts.push(`Ton ton doit être ${toneMap[cfg.tone] || toneMap.chaleureux}.`);

  // Language
  if (cfg.language === 'fr') parts.push('Réponds TOUJOURS en français.');
  else if (cfg.language === 'en') parts.push('Always respond in English.');
  else parts.push('Réponds dans la langue du client (français ou anglais).');

  // Length limit
  parts.push(`Réponse MAX ${cfg.maxResponseLength} caractères (limite WhatsApp). Sois concis et actionnable.`);

  // Business context
  if (cfg.businessName) parts.push(`\n── CONTEXTE BUSINESS ──\n- Business: ${cfg.businessName}`);
  if (cfg.industry) parts.push(`- Industrie: ${cfg.industry}`);
  if (cfg.country) parts.push(`- Pays/Région: ${cfg.country}`);
  if (cfg.services.length > 0) {
    parts.push(`- Services/Produits:\n${cfg.services.map((s) => `  • ${s}`).join('\n')}`);
  }
  if (cfg.pricing) parts.push(`- Tarifs: ${cfg.pricing}`);
  if (cfg.contactInfo) parts.push(`- Coordonnées à partager si demandé: ${cfg.contactInfo}`);

  // FAQ
  if (cfg.faq.length > 0) {
    parts.push(`\n── FAQ (utilise ces réponses si la question correspond) ──`);
    for (const entry of cfg.faq) {
      parts.push(`Q: ${entry.question}\nR: ${entry.answer}`);
    }
  }

  // Product catalog (visual)
  if (cfg.catalog.length > 0) {
    parts.push(`\n── CATALOGUE PRODUITS ──`);
    parts.push(`Si le client demande un produit, son prix, ou "quoi choisir", présente les produits pertinents ci-dessous. Format suggéré:`);
    parts.push(`"📸 [Nom du produit]\n💰 [Prix]\n📝 [Description courte]\nDisponible: [oui/non]"`);
    parts.push(``);
    for (const product of cfg.catalog) {
      parts.push(`• ${product.name} (${product.category || 'général'})`);
      parts.push(`  Prix: ${product.price}`);
      parts.push(`  Description: ${product.description}`);
      parts.push(`  Disponible: ${product.inStock ? 'OUI' : 'NON (rupture)'}`);
    }
    parts.push(``);
    parts.push(`IMPORTANT: Quand tu présentes un produit, mentionne son nom exact et son prix. Si le client veut voir l'image ou commander, dis-lui que tu vas lui envoyer la photo du produit.`);
  }

  // Custom instructions (free text — highest priority)
  if (cfg.systemPrompt.trim()) {
    parts.push(`\n── INSTRUCTIONS SPÉCIFIQUES ──\n${cfg.systemPrompt.trim()}`);
  }

  // Behavior guidelines
  parts.push(`\n── RÈGLES ──
- Si tu ne sais pas, dis-le honnêtement et propose de transmettre au propriétaire.
- Ne promets jamais de prix ou délais non mentionnés dans le contexte.
- Sois proactif : propose des next steps (réserver, commander, visiter, etc.).
- Si le client semble frustré, reste calme et propose une solution concrète.`);

  return parts.join('\n');
}

// Check if the current time is within business hours
export function isWithinBusinessHours(cfg: WhatsAppAgentConfig, now: Date = new Date()): boolean {
  if (!cfg.businessHours.enabled) return true;
  const day = now.getDay(); // 0 = Sunday
  if (!cfg.businessHours.activeDays.includes(day)) return false;
  // Compare HH:MM
  const [h, m] = cfg.businessHours.startTime.split(':').map(Number);
  const [eh, em] = cfg.businessHours.endTime.split(':').map(Number);
  const startMin = h * 60 + m;
  const endMin = eh * 60 + em;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= startMin && nowMin <= endMin;
}
