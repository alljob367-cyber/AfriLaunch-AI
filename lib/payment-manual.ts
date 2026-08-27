// AfriLaunch AI — Manual payment store (server-side, persisted to JSON)
// Stores payment orders (Mobile Money, bank transfer) submitted by users with
// their proof file, and lets admins approve/reject them.
// When an order is approved, the corresponding plan or credit pack is applied
// to the user automatically.
//
// SERVER-ONLY: this module uses fs. Do not import from client components.

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PLANS, CREDIT_PACKS, type PlanId } from './user-types';
import { changeUserPlan, addCredits } from './user-store';

// ─── Types ────────────────────────────────────────────────────────────
export type ManualPaymentStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type PaymentMethod = 'mtn-momo' | 'orange-money' | 'bank-transfer' | 'wave' | 'moov-money' | 'stripe-card';

export interface ManualPaymentOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  // What they're paying for
  type: 'plan' | 'pack';
  itemId: string;
  itemName: string;
  amountFCFA: number;
  credits: number;
  // Payment method
  country: string; // 'CM', 'SN', etc.
  method: PaymentMethod;
  methodLabel: string;
  // Proof
  proofFileName?: string;
  proofFileType?: string;
  proofFileSize?: number;
  proofUploadedAt?: string;
  senderName?: string;
  senderPhone?: string;
  transactionReference?: string;
  // Admin
  status: ManualPaymentStatus;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ─── Countries & methods ──────────────────────────────────────────────
export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  number: string;
  holder: string;
  instructions: string;
}

export interface CountryInfo {
  name: string;
  currency: string;
  methods: PaymentMethodInfo[];
}

// Cameroon first — extensible to SN, CI, GA, etc.
export const COUNTRIES: Record<string, CountryInfo> = {
  CM: {
    name: 'Cameroun',
    currency: 'XAF',
    methods: [
      {
        id: 'mtn-momo',
        name: 'MTN Mobile Money',
        number: '+237 6XX XXX XXX',
        holder: 'AfriLaunch AI',
        instructions: "Envoyez le montant au numéro MTN MoMo ci-dessus. Utilisez votre code marchand.",
      },
      {
        id: 'orange-money',
        name: 'Orange Money',
        number: '+237 6YY YYY YYY',
        holder: 'AfriLaunch AI',
        instructions: "Envoyez le montant au numéro Orange Money ci-dessus.",
      },
      {
        id: 'bank-transfer',
        name: 'Virement bancaire',
        number: 'Banque: BICEC\nIBAN: CM21 10001 050201234567 89\nBIC: BICECCMCX',
        holder: 'AfriLaunch AI SARL',
        instructions: "Effectuez le virement puis téléchargez le justificatif.",
      },
    ],
  },
  // Future: SN, CI, GA, etc. — listed here so the UI can show them as
  // "Bientôt disponible".
  SN: {
    name: 'Sénégal',
    currency: 'XOF',
    methods: [],
  },
  CI: {
    name: 'Côte d\'Ivoire',
    currency: 'XOF',
    methods: [],
  },
  GA: {
    name: 'Gabon',
    currency: 'XAF',
    methods: [],
  },
};

// ─── Persistence ──────────────────────────────────────────────────────
const ORDERS_PATH = path.join('/home/z/my-project/data', 'manual-payments.json');

interface ManualPaymentStore {
  orders: ManualPaymentOrder[];
}

async function readStore(): Promise<ManualPaymentStore> {
  try {
    const raw = await fs.readFile(ORDERS_PATH, 'utf-8');
    return JSON.parse(raw) as ManualPaymentStore;
  } catch {
    return { orders: [] };
  }
}

async function writeStore(store: ManualPaymentStore): Promise<void> {
  await fs.mkdir(path.dirname(ORDERS_PATH), { recursive: true });
  await fs.writeFile(ORDERS_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

// ─── Helpers ──────────────────────────────────────────────────────────
function generateOrderId(): string {
  return 'pay_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
}

export function getMethodLabel(country: string, method: PaymentMethod): string {
  const c = COUNTRIES[country];
  if (!c) return method;
  const m = c.methods.find((x) => x.id === method);
  return m?.name ?? method;
}

// ─── Public API ───────────────────────────────────────────────────────
export interface CreateOrderInput {
  userId: string;
  userEmail: string;
  userName: string;
  type: 'plan' | 'pack';
  itemId: string;
  country: string;
  method: PaymentMethod;
}

export async function createManualPaymentOrder(
  data: CreateOrderInput,
): Promise<{ ok: true; order: ManualPaymentOrder } | { ok: false; error: string }> {
  // Resolve item price + name
  let itemName = '';
  let amountFCFA = 0;
  let credits = 0;

  if (data.type === 'plan') {
    const plan = PLANS[data.itemId as PlanId];
    if (!plan) {
      return { ok: false, error: 'Plan introuvable' };
    }
    itemName = `Plan ${plan.name} (mensuel)`;
    amountFCFA = plan.priceMonthly;
    credits = plan.creditsPerMonth;
  } else if (data.type === 'pack') {
    const pack = CREDIT_PACKS.find((p) => p.id === data.itemId);
    if (!pack) {
      return { ok: false, error: 'Pack introuvable' };
    }
    itemName = `Pack ${pack.credits.toLocaleString('fr-FR')} crédits`;
    amountFCFA = pack.price;
    credits = pack.credits;
  } else {
    return { ok: false, error: "Type invalide (doit être 'plan' ou 'pack')" };
  }

  // Validate country + method
  const countryInfo = COUNTRIES[data.country];
  if (!countryInfo) {
    return { ok: false, error: 'Pays non supporté' };
  }
  const methodInfo = countryInfo.methods.find((m) => m.id === data.method);
  if (!methodInfo) {
    return { ok: false, error: 'Méthode de paiement non disponible pour ce pays' };
  }

  const now = new Date().toISOString();
  const order: ManualPaymentOrder = {
    id: generateOrderId(),
    userId: data.userId,
    userEmail: data.userEmail,
    userName: data.userName,
    type: data.type,
    itemId: data.itemId,
    itemName,
    amountFCFA,
    credits,
    country: data.country,
    method: data.method,
    methodLabel: methodInfo.name,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const store = await readStore();
  store.orders.unshift(order);
  // Cap the store at 5000 orders
  if (store.orders.length > 5000) store.orders = store.orders.slice(0, 5000);
  await writeStore(store);
  return { ok: true, order };
}

export async function getManualPaymentOrderById(
  id: string,
): Promise<ManualPaymentOrder | null> {
  const store = await readStore();
  return store.orders.find((o) => o.id === id) ?? null;
}

export interface ManualPaymentFilters {
  status?: ManualPaymentStatus;
  userId?: string;
  country?: string;
  method?: PaymentMethod;
}

export async function getManualPaymentOrders(
  filters?: ManualPaymentFilters,
): Promise<ManualPaymentOrder[]> {
  const store = await readStore();
  let items = store.orders;
  if (filters?.status) items = items.filter((o) => o.status === filters.status);
  if (filters?.userId) items = items.filter((o) => o.userId === filters.userId);
  if (filters?.country) items = items.filter((o) => o.country === filters.country);
  if (filters?.method) items = items.filter((o) => o.method === filters.method);
  return items;
}

export interface ManualPaymentUpdate {
  proofFileName?: string;
  proofFileType?: string;
  proofFileSize?: number;
  proofUploadedAt?: string;
  senderName?: string;
  senderPhone?: string;
  transactionReference?: string;
  status?: ManualPaymentStatus;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export async function updateManualPaymentOrder(
  id: string,
  updates: ManualPaymentUpdate,
): Promise<ManualPaymentOrder | null> {
  const store = await readStore();
  const order = store.orders.find((o) => o.id === id);
  if (!order) return null;
  Object.assign(order, updates, { updatedAt: new Date().toISOString() });
  await writeStore(store);
  return order;
}

export async function approveManualPaymentOrder(
  id: string,
  adminEmail: string,
): Promise<{ ok: true; order: ManualPaymentOrder } | { ok: false; error: string }> {
  const store = await readStore();
  const order = store.orders.find((o) => o.id === id);
  if (!order) {
    return { ok: false, error: 'Commande introuvable' };
  }
  if (order.status === 'approved') {
    return { ok: false, error: 'Cette commande a déjà été approuvée' };
  }

  // Apply the entitlement
  if (order.type === 'plan') {
    const updatedUser = await changeUserPlan(order.userId, order.itemId as PlanId, 'manual');
    if (!updatedUser) {
      return { ok: false, error: 'Utilisateur introuvable — impossible d\'activer le plan' };
    }
  } else if (order.type === 'pack') {
    const pack = CREDIT_PACKS.find((p) => p.id === order.itemId);
    if (!pack) {
      return { ok: false, error: 'Pack introuvable — impossible d\'ajouter les crédits' };
    }
    const updatedUser = await addCredits(order.userId, pack.credits);
    if (!updatedUser) {
      return { ok: false, error: 'Utilisateur introuvable — impossible d\'ajouter les crédits' };
    }
  }

  const now = new Date().toISOString();
  order.status = 'approved';
  order.reviewedBy = adminEmail;
  order.reviewedAt = now;
  order.updatedAt = now;
  await writeStore(store);
  return { ok: true, order };
}

export async function rejectManualPaymentOrder(
  id: string,
  adminEmail: string,
  reason: string,
): Promise<{ ok: true; order: ManualPaymentOrder } | { ok: false; error: string }> {
  const store = await readStore();
  const order = store.orders.find((o) => o.id === id);
  if (!order) {
    return { ok: false, error: 'Commande introuvable' };
  }
  if (order.status === 'approved') {
    return { ok: false, error: 'Cette commande a déjà été approuvée — impossible de la rejeter' };
  }
  const now = new Date().toISOString();
  order.status = 'rejected';
  order.adminNote = reason || order.adminNote;
  order.reviewedBy = adminEmail;
  order.reviewedAt = now;
  order.updatedAt = now;
  await writeStore(store);
  return { ok: true, order };
}

export interface ManualPaymentStats {
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  total: number;
  pendingAmountFCFA: number;
  approvedAmountFCFA: number;
}

export async function getManualPaymentStats(): Promise<ManualPaymentStats> {
  const store = await readStore();
  const stats: ManualPaymentStats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    total: store.orders.length,
    pendingAmountFCFA: 0,
    approvedAmountFCFA: 0,
  };
  for (const o of store.orders) {
    if (o.status === 'pending') {
      stats.pending++;
      stats.pendingAmountFCFA += o.amountFCFA;
    } else if (o.status === 'approved') {
      stats.approved++;
      stats.approvedAmountFCFA += o.amountFCFA;
    } else if (o.status === 'rejected') {
      stats.rejected++;
    } else if (o.status === 'expired') {
      stats.expired++;
    }
  }
  return stats;
}
