// AfriLaunch AI — Paiement manuel module (Mobile Money + bank transfer)
// User flow: choose item (plan or pack) → choose country → choose method →
// upload proof → admin approves under 24h.
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, Loader2, LogIn, Upload, FileCheck2, CheckCircle2,
  Clock, XCircle, AlertCircle, ChevronDown, Globe,
  Smartphone, Banknote, Image as ImageIcon, X,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';
import {
  PLANS, CREDIT_PACKS, formatFCFA, type PlanId, type Plan, type CreditPack,
} from '@/lib/user-types';

// ─── Client-side mirror of COUNTRIES (kept in sync with lib/payment-manual.ts)
type MethodId = 'mtn-momo' | 'orange-money' | 'bank-transfer' | 'wave' | 'moov-money' | 'stripe-card';

interface ClientMethod {
  id: MethodId;
  name: string;
  number: string;
  holder: string;
  instructions: string;
  icon: typeof Smartphone;
}

interface ClientCountry {
  name: string;
  currency: string;
  methods: ClientMethod[];
  soon?: boolean;
}

const COUNTRIES: Record<string, ClientCountry> = {
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
        icon: Smartphone,
      },
      {
        id: 'orange-money',
        name: 'Orange Money',
        number: '+237 6YY YYY YYY',
        holder: 'AfriLaunch AI',
        instructions: "Envoyez le montant au numéro Orange Money ci-dessus.",
        icon: Smartphone,
      },
      {
        id: 'bank-transfer',
        name: 'Virement bancaire',
        number: 'Banque: BICEC\nIBAN: CM21 10001 050201234567 89\nBIC: BICECCMCX',
        holder: 'AfriLaunch AI SARL',
        instructions: "Effectuez le virement puis téléchargez le justificatif.",
        icon: Banknote,
      },
    ],
  },
  SN: { name: 'Sénégal', currency: 'XOF', methods: [], soon: true },
  CI: { name: "Côte d'Ivoire", currency: 'XOF', methods: [], soon: true },
  GA: { name: 'Gabon', currency: 'XAF', methods: [], soon: true },
};

type CountryCode = keyof typeof COUNTRIES;

interface ExistingOrder {
  id: string;
  type: 'plan' | 'pack';
  itemId: string;
  itemName: string;
  amountFCFA: number;
  country: string;
  method: MethodId;
  methodLabel: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  adminNote?: string;
  senderName?: string;
  senderPhone?: string;
  transactionReference?: string;
  proofFileName?: string;
  createdAt: string;
}

interface FullUser {
  id: string;
  firstName: string;
  email: string;
  plan: PlanId;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusBadge(status: ExistingOrder['status']) {
  switch (status) {
    case 'pending':
      return { label: 'En attente', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: Clock };
    case 'approved':
      return { label: 'Approuvé', className: 'bg-green-500/15 text-green-300 border-green-500/30', icon: CheckCircle2 };
    case 'rejected':
      return { label: 'Rejeté', className: 'bg-red-500/15 text-red-300 border-red-500/30', icon: XCircle };
    case 'expired':
      return { label: 'Expiré', className: 'bg-gray-500/15 text-gray-400 border-gray-500/30', icon: AlertCircle };
  }
}

export default function PaymentManualPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<FullUser | null>(null);
  const [orders, setOrders] = useState<ExistingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  // Form state
  const [country, setCountry] = useState<CountryCode>('CM');
  const [selectedItem, setSelectedItem] = useState<{ type: 'plan' | 'pack'; itemId: string } | null>(null);
  const [method, setMethod] = useState<MethodId | null>(null);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setAuthError(false);
    try {
      const [meRes, ordersRes] = await Promise.all([
        fetch('/api/auth/me', { credentials: 'include' }),
        fetch('/api/payment-manual/list', { credentials: 'include' }),
      ]);

      if (meRes.status === 401) {
        setAuthError(true);
        setLoading(false);
        return;
      }
      if (!meRes.ok) throw new Error(`Erreur ${meRes.status}`);
      const meData = await meRes.json();
      setUser(meData.user as FullUser);
      setSenderName(
        [meData.user?.firstName, meData.user?.lastName].filter(Boolean).join(' ') || '',
      );

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders((ordersData.orders ?? []) as ExistingOrder[]);
      }
    } catch (err) {
      toast({
        title: 'Erreur de chargement',
        description: (err as Error).message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-select the first method when the country changes
  useEffect(() => {
    const c = COUNTRIES[country];
    if (c && c.methods.length > 0 && !c.methods.find((m) => m.id === method)) {
      setMethod(c.methods[0].id);
    }
  }, [country, method]);

  // Close the country dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
    }
    if (countryOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [countryOpen]);

  // ─── Read query params (?item=X&type=plan) on mount ─────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const item = params.get('item');
    const type = params.get('type');
    if (item && (type === 'plan' || type === 'pack')) {
      setSelectedItem({ type, itemId: item });
    }
  }, []);

  const planList = useMemo(() => {
    return (Object.keys(PLANS) as PlanId[]).map((id) => PLANS[id]);
  }, []);

  const selectedItemInfo = useMemo(() => {
    if (!selectedItem) return null;
    if (selectedItem.type === 'plan') {
      const p = PLANS[selectedItem.itemId as PlanId];
      return p ? { name: `Plan ${p.name}`, amount: p.priceMonthly } : null;
    }
    const pack = CREDIT_PACKS.find((p) => p.id === selectedItem.itemId);
    return pack ? { name: `Pack ${pack.credits.toLocaleString('fr-FR')} crédits`, amount: pack.price } : null;
  }, [selectedItem]);

  const selectedMethod = useMemo(() => {
    const c = COUNTRIES[country];
    if (!c || !method) return null;
    return c.methods.find((m) => m.id === method) ?? null;
  }, [country, method]);

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setProofFile(file);
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setProofFile(file);
  }

  function validateBeforeSubmit(): string | null {
    if (!selectedItem) return 'Veuillez sélectionner un plan ou un pack.';
    if (!method) return 'Veuillez sélectionner une méthode de paiement.';
    if (!senderName.trim()) return 'Veuillez indiquer le nom de l\'expéditeur.';
    if (!senderPhone.trim()) return 'Veuillez indiquer le numéro de téléphone utilisé.';
    if (!proofFile) return 'Veuillez télécharger le justificatif de paiement.';
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(proofFile.type)) {
      return 'Format non supporté. Formats acceptés: JPG, PNG, WebP, PDF.';
    }
    if (proofFile.size > 10 * 1024 * 1024) {
      return 'Le fichier dépasse la taille maximale autorisée (10 MB).';
    }
    return null;
  }

  async function handleSubmit() {
    const err = validateBeforeSubmit();
    if (err) {
      toast({ title: 'Champs manquants', description: err, variant: 'warning' });
      return;
    }
    if (!user || !selectedItem || !method) return;

    setSubmitting(true);
    try {
      // 1. Create the order
      const createRes = await fetch('/api/payment-manual/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: selectedItem.type,
          itemId: selectedItem.itemId,
          country,
          method,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.order) {
        throw new Error(createData.error || 'Impossible de créer la commande');
      }
      const orderId: string = createData.order.id;

      // 2. Upload the proof
      const fd = new FormData();
      fd.append('orderId', orderId);
      fd.append('senderName', senderName.trim());
      fd.append('senderPhone', senderPhone.trim());
      fd.append('transactionReference', transactionReference.trim());
      if (proofFile) {
        fd.append('file', proofFile, proofFile.name);
      }
      const upRes = await fetch('/api/payment-manual/upload', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const upData = await upRes.json();
      if (!upRes.ok || !upData.order) {
        throw new Error(upData.error || 'Échec du téléversement du justificatif');
      }

      toast({
        title: 'Justificatif envoyé',
        description: 'Votre paiement est en cours de vérification. Activation sous 24h.',
        variant: 'success',
      });

      // Reset the form
      setProofFile(null);
      setTransactionReference('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh orders
      await loadData();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: (err as Error).message,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" aria-hidden="true" />
          <p className="text-sm text-gray-400">Chargement…</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen mesh-bg">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl animate-aurora" />
        </div>
        <div className="relative z-10 p-6 md:p-8 max-w-3xl mx-auto">
          <ModuleHeader
            title="Paiement manuel"
            description="Payez par Mobile Money ou virement bancaire. Téléchargez votre justificatif et l'activation se fait sous 24h."
            icon={Wallet}
            gradient="from-emerald-500 to-green-600"
          />
          <div className="glass rounded-2xl p-8 border border-white/5">
            <EmptyState
              icon={LogIn}
              title="Connectez-vous"
              description="Vous devez être connecté pour soumettre un paiement manuel."
              action={{ label: 'Se connecter', href: '/login' }}
              gradient="from-emerald-500 to-green-600"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-green-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Paiement manuel"
          description="Payez par Mobile Money ou virement bancaire. Téléchargez votre justificatif et l'activation se fait sous 24h."
          icon={Wallet}
          gradient="from-emerald-500 to-green-600"
        />

        <div className="space-y-8">
          {/* ─── Step 1: Country ─────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium"
            aria-labelledby="country-title"
          >
            <h2 id="country-title" className="text-lg font-bold mb-1 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              1. Pays
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Sélectionnez votre pays pour voir les méthodes disponibles.
            </p>
            <div ref={countryRef} className="relative max-w-md">
              <button
                type="button"
                onClick={() => setCountryOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl glass border border-white/10 hover:border-white/20 transition-colors text-left"
                aria-haspopup="listbox"
                aria-expanded={countryOpen}
              >
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-base" aria-hidden="true">🇨🇲</span>
                  {COUNTRIES[country].name}
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {COUNTRIES[country].currency}
                  </span>
                </span>
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', countryOpen && 'rotate-180')} aria-hidden="true" />
              </button>
              {countryOpen && (
                <ul
                  role="listbox"
                  className="absolute z-20 mt-2 w-full glass rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                >
                  {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => {
                    const c = COUNTRIES[code];
                    const soon = (c as { soon?: boolean }).soon;
                    return (
                      <li key={code}>
                        <button
                          type="button"
                          disabled={soon}
                          onClick={() => {
                            if (soon) return;
                            setCountry(code);
                            setCountryOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                            soon
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-gray-200 hover:bg-white/5',
                            country === code && !soon && 'bg-emerald-500/10 text-emerald-300',
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-base" aria-hidden="true">
                              {code === 'CM' ? '🇨🇲' : code === 'SN' ? '🇸🇳' : code === 'CI' ? '🇨🇮' : code === 'GA' ? '🇬🇦' : '🏳️'}
                            </span>
                            {c.name}
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                              {c.currency}
                            </span>
                          </span>
                          {soon && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-500 border border-gray-500/30">
                              Bientôt
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.section>

          {/* ─── Step 2: Item selection (plans + packs) ─────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-premium"
            aria-labelledby="item-title"
          >
            <h2 id="item-title" className="text-lg font-bold mb-1 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              2. Que payez-vous ?
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Choisissez un abonnement ou un pack de crédits.
            </p>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 mt-4">
              Plans
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {planList.map((plan) => {
                const isSel = selectedItem?.type === 'plan' && selectedItem.itemId === plan.id;
                const isCurrent = plan.id === user?.plan;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedItem({ type: 'plan', itemId: plan.id })}
                    aria-pressed={isSel}
                    className={cn(
                      'relative p-4 rounded-xl border text-left transition-all',
                      isSel
                        ? 'border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/40'
                        : 'border-white/10 glass hover:border-white/20',
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm">{plan.name}</h3>
                      {plan.popular && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          Populaire
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold gradient-text">
                      {formatFCFA(plan.priceMonthly)}
                      <span className="text-xs text-gray-400 font-normal"> / mois</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {plan.creditsPerMonth === -1
                        ? 'Crédits illimités'
                        : `${plan.creditsPerMonth.toLocaleString('fr-FR')} crédits/mois`}
                    </p>
                    {isCurrent && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Actuel
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Packs de crédits
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CREDIT_PACKS.map((pack) => {
                const isSel = selectedItem?.type === 'pack' && selectedItem.itemId === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setSelectedItem({ type: 'pack', itemId: pack.id })}
                    aria-pressed={isSel}
                    className={cn(
                      'relative p-4 rounded-xl border text-left transition-all',
                      isSel
                        ? 'border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/40'
                        : 'border-white/10 glass hover:border-white/20',
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-gray-500">Pack</p>
                      {pack.discount > 0 && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          -{pack.discount}%
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold gradient-text">
                      {pack.credits.toLocaleString('fr-FR')}
                      <span className="text-xs text-gray-400 font-normal"> crédits</span>
                    </p>
                    <p className="text-sm font-semibold mt-1">{formatFCFA(pack.price)}</p>
                  </button>
                );
              })}
            </div>
          </motion.section>

          {/* ─── Step 3: Method selection ───────────────────────────── */}
          {selectedMethod && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-premium"
              aria-labelledby="method-title"
            >
              <h2 id="method-title" className="text-lg font-bold mb-1 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                3. Méthode de paiement
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Méthodes disponibles pour {COUNTRIES[country].name}.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {COUNTRIES[country].methods.map((m) => {
                  const isSel = method === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      aria-pressed={isSel}
                      className={cn(
                        'p-4 rounded-xl border text-left transition-all',
                        isSel
                          ? 'border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/40'
                          : 'border-white/10 glass hover:border-white/20',
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                        <h3 className="font-bold text-sm">{m.name}</h3>
                      </div>
                      <p className="text-[11px] text-gray-400 whitespace-pre-line">
                        {m.number}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Payment instructions box */}
              {selectedItemInfo && selectedMethod && (
                <div className="mt-6 glass rounded-xl p-5 border border-emerald-500/30 bg-emerald-500/5">
                  <p className="text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-3">
                    Instructions de paiement
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 w-24 flex-shrink-0 mt-0.5">
                        Bénéficiaire
                      </span>
                      <span className="text-white font-semibold">{selectedMethod.holder}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 w-24 flex-shrink-0 mt-0.5">
                        {selectedMethod.id === 'bank-transfer' ? 'Coordonnées' : 'Numéro'}
                      </span>
                      <span className="text-white whitespace-pre-line font-mono text-xs">
                        {selectedMethod.number}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 w-24 flex-shrink-0 mt-0.5">
                        Montant à envoyer
                      </span>
                      <span className="text-emerald-300 font-bold text-base">
                        {formatFCFA(selectedItemInfo.amount)}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 w-24 flex-shrink-0 mt-0.5">
                        Article
                      </span>
                      <span className="text-white">{selectedItemInfo.name}</span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-white/5">
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {selectedMethod.instructions}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* ─── Step 4: Proof upload ───────────────────────────────── */}
          {selectedMethod && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card-premium"
              aria-labelledby="proof-title"
            >
              <h2 id="proof-title" className="text-lg font-bold mb-1 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                4. Justificatif de paiement
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Téléversez une capture d&apos;écran du paiement ou le justificatif PDF (max 10 MB).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sender-name" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Nom de l&apos;expéditeur <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="sender-name"
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Nom figurant sur le paiement"
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-emerald-500/40 outline-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="sender-phone" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Téléphone utilisé <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="sender-phone"
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-emerald-500/40 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="tx-ref" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                  Référence de transaction
                  <span className="text-gray-600 normal-case ml-2 font-normal">
                    (ID MoMo / référence virement — optionnel pour virement)
                  </span>
                </label>
                <input
                  id="tx-ref"
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="MP240101.1234.ABCDEF"
                  className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-emerald-500/40 outline-none text-sm font-mono"
                />
              </div>

              {/* Drag & drop area */}
              <div className="mt-4">
                <label
                  htmlFor="proof-file"
                  className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide"
                >
                  Fichier justificatif <span className="text-red-400">*</span>
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className={cn(
                    'relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all',
                    dragActive
                      ? 'border-emerald-500/60 bg-emerald-500/5'
                      : 'border-white/10 hover:border-emerald-500/40 glass',
                  )}
                >
                  <input
                    ref={fileInputRef}
                    id="proof-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFilePick}
                    className="sr-only"
                  />
                  {proofFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                        <FileCheck2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                      </div>
                      <p className="text-sm text-white font-semibold">{proofFile.name}</p>
                      <p className="text-[11px] text-gray-500">
                        {(proofFile.size / 1024 / 1024).toFixed(2)} MB · {proofFile.type || 'inconnu'}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProofFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] text-red-300 hover:text-red-200"
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <p className="text-sm text-white">Glissez votre fichier ici</p>
                      <p className="text-[11px] text-gray-500">
                        ou cliquez pour parcourir · JPG, PNG, WebP, PDF · max 10 MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="text-[11px] text-gray-500 max-w-md">
                  En soumettant, vous confirmez avoir effectué le paiement. L&apos;activation se fait sous 24h après vérification par notre équipe.
                </p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:scale-105 transition-transform shadow-lg disabled:opacity-60 disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" aria-hidden="true" />
                      Soumettre le justificatif
                    </>
                  )}
                </button>
              </div>
            </motion.section>
          )}

          {/* ─── Existing orders ────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            aria-labelledby="orders-title"
          >
            <h2 id="orders-title" className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              Mes paiements ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <div className="glass rounded-2xl p-8 border border-white/5">
                <EmptyState
                  icon={Wallet}
                  title="Aucun paiement soumis"
                  description="Vos paiements manuels apparaîtront ici avec leur statut de vérification."
                  gradient="from-emerald-500 to-green-600"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const sb = statusBadge(order.status);
                  const SIcon = sb.icon;
                  return (
                    <div
                      key={order.id}
                      className="glass rounded-xl p-4 border border-white/5 flex flex-wrap items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-sm">{order.itemName}</h3>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                              sb.className,
                            )}
                          >
                            <SIcon className="w-3 h-3" aria-hidden="true" />
                            {sb.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {formatDate(order.createdAt)} · {order.methodLabel} · {order.country}
                        </p>
                        <p className="text-sm font-semibold text-emerald-300 mt-1">
                          {formatFCFA(order.amountFCFA)}
                        </p>
                        {order.status === 'rejected' && order.adminNote && (
                          <p className="text-xs text-red-300 mt-1">
                            <AlertCircle className="w-3 h-3 inline mr-1" aria-hidden="true" />
                            {order.adminNote}
                          </p>
                        )}
                        {order.senderName && (
                          <p className="text-[11px] text-gray-500 mt-1">
                            Expéditeur : {order.senderName} · {order.senderPhone}
                            {order.transactionReference ? ` · réf: ${order.transactionReference}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}
