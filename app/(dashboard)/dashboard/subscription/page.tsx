// AfriLaunch AI — Abonnement module (plan, credits, packs, checkout)
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CreditCard, Loader2, Check, Sparkles, Zap, TrendingUp,
  Receipt, AlertCircle, Crown, LogIn,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';
import {
  PLANS, CREDIT_PACKS, type PlanId, type Plan, type CreditPack,
} from '@/lib/user-types';

interface FullUser {
  id: string;
  firstName: string;
  email: string;
  plan: PlanId;
  planStatus: string;
  credits: number;
  creditsUsedThisMonth: number;
  creditsResetAt: string;
}

interface CreditsInfo {
  credits: number;
  creditsUsedThisMonth: number;
  plan: PlanId;
  creditsResetAt: string;
}

const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'business', 'enterprise'];

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatNumber(n: number): string {
  if (n >= 999999) return 'Illimité';
  return new Intl.NumberFormat('fr-FR').format(n);
}

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<FullUser | null>(null);
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setAuthError(false);
    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (meRes.status === 401) {
        setAuthError(true);
        setUser(null);
        setCredits(null);
        setLoading(false);
        return;
      }
      if (!meRes.ok) {
        throw new Error(`Erreur ${meRes.status}`);
      }
      const meData = await meRes.json();
      const fullUser = meData.user as FullUser;
      setUser(fullUser);

      const crRes = await fetch('/api/users/credits', { credentials: 'include' });
      if (crRes.ok) {
        const crData = await crRes.json();
        setCredits(crData as CreditsInfo);
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

  // Handle ?success=1 and ?canceled=1 query params (read from window to avoid
  // the Suspense boundary required by useSearchParams in Next.js 16).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
      toast({
        title: 'Paiement réussi !',
        description: 'Votre plan a été mis à jour.',
        variant: 'success',
      });
      // Clean the URL so the toast doesn't reappear on refresh.
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('canceled') === '1') {
      toast({
        title: 'Paiement annulé',
        description: 'Vous pouvez réessayer quand vous le souhaitez.',
        variant: 'warning',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  async function handleChoosePlan(plan: Plan) {
    if (plan.id === user?.plan) return;
    if (plan.id === 'free') {
      toast({
        title: 'Plan gratuit',
        description: 'Le plan Free est attribué par défaut. Contactez le support pour le réinitialiser.',
        variant: 'warning',
      });
      return;
    }
    setLoadingItem(`plan-${plan.id}`);
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'plan', itemId: plan.id, billingCycle: 'monthly' }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Impossible de créer la session de paiement');
      }
      window.location.href = data.url;
    } catch (err) {
      toast({
        title: 'Erreur',
        description: (err as Error).message,
        variant: 'error',
      });
      setLoadingItem(null);
    }
  }

  async function handleBuyPack(pack: CreditPack) {
    setLoadingItem(`pack-${pack.id}`);
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'pack', itemId: pack.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Impossible de créer la session de paiement');
      }
      window.location.href = data.url;
    } catch (err) {
      toast({
        title: 'Erreur',
        description: (err as Error).message,
        variant: 'error',
      });
      setLoadingItem(null);
    }
  }

  // ─── States ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" aria-hidden="true" />
          <p className="text-sm text-gray-400">Chargement de votre abonnement…</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen mesh-bg">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-aurora" />
        </div>
        <div className="relative z-10 p-6 md:p-8 max-w-3xl mx-auto">
          <ModuleHeader
            title="Mon abonnement"
            description="Gérez votre plan, vos crédits IA et votre facturation."
            icon={CreditCard}
            gradient="from-indigo-500 to-violet-600"
          />
          <div className="glass rounded-2xl p-8 border border-white/5">
            <EmptyState
              icon={LogIn}
              title="Connectez-vous"
              description="Vous devez être connecté pour gérer votre abonnement et vos crédits IA."
              action={{ label: 'Se connecter', href: '/login' }}
              gradient="from-indigo-500 to-violet-600"
            />
          </div>
        </div>
      </div>
    );
  }

  const currentPlan: Plan = PLANS[user?.plan ?? 'free'];
  const used = credits?.creditsUsedThisMonth ?? user?.creditsUsedThisMonth ?? 0;
  const remaining = credits?.credits ?? user?.credits ?? 0;
  const isUnlimited = currentPlan.creditsPerMonth === -1 || remaining >= 999999;
  const total = isUnlimited ? 1 : used + remaining;
  const usagePct = isUnlimited ? 0 : Math.min(100, Math.round((used / total) * 100));

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-5xl mx-auto">
        <ModuleHeader
          title="Mon abonnement"
          description="Gérez votre plan, vos crédits IA et votre facturation."
          icon={CreditCard}
          gradient="from-indigo-500 to-violet-600"
        />

        {/* ─── Current plan card ─────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium mb-8"
          aria-labelledby="current-plan-title"
        >
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Plan actuel
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg">
                  <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                  {currentPlan.name}
                </span>
                <span className="text-sm text-gray-400">
                  {currentPlan.priceMonthly === 0
                    ? 'Gratuit'
                    : `${currentPlan.priceMonthly.toFixed(2)} $ / mois`}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-widest">Statut</p>
              <p className="text-sm font-semibold text-green-400 mt-1">Actif</p>
            </div>
          </div>

          {/* Credits block */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
                Crédits restants ce mois
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold gradient-text">
                  {isUnlimited ? '∞' : formatNumber(remaining)}
                </span>
                <span className="text-sm text-gray-400">
                  {isUnlimited ? 'Illimité' : 'crédits'}
                </span>
              </div>

              {!isUnlimited && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>{used.toLocaleString('fr-FR')} utilisés</span>
                    <span>{total.toLocaleString('fr-FR')} au total</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden" aria-hidden="true">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
                Renouvellement le
              </p>
              <p className="text-sm font-semibold">
                {formatDate(credits?.creditsResetAt ?? user?.creditsResetAt ?? new Date().toISOString())}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Vos crédits se réinitialisent automatiquement.
              </p>
            </div>
          </div>

          {/* Features list */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
              Inclus dans votre plan
            </p>
            <ul className="grid sm:grid-cols-2 gap-2 list-none p-0 m-0">
              {currentPlan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* ─── Plan comparison ───────────────────────────────────────── */}
        <section className="mb-10" aria-labelledby="plans-title">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-indigo-400" aria-hidden="true" />
            <h2 id="plans-title" className="text-lg font-bold">Comparer les plans</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {PLAN_ORDER.map((id) => {
              const plan = PLANS[id];
              const isCurrent = id === user?.plan;
              const isLoading = loadingItem === `plan-${id}`;
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'card-premium flex flex-col',
                    plan.popular && 'ring-2 ring-violet-500/50',
                    isCurrent && 'ring-2 ring-indigo-500/50',
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base">{plan.name}</h3>
                    {plan.popular && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                        <Sparkles className="w-3 h-3" aria-hidden="true" />
                        Populaire
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Plan actuel
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <span className="text-2xl font-bold">
                      {plan.priceMonthly === 0 ? '0 $' : `${plan.priceMonthly.toFixed(2)} $`}
                    </span>
                    <span className="text-xs text-gray-400"> / mois</span>
                  </div>

                  <p className="text-xs text-gray-400 mb-3">
                    {plan.creditsPerMonth === -1
                      ? 'Crédits illimités'
                      : `${formatNumber(plan.creditsPerMonth)} crédits / mois`}
                  </p>

                  <ul className="space-y-1.5 mb-5 flex-1 list-none p-0 m-0">
                    {plan.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-gray-300">
                        <Check className="w-3 h-3 text-indigo-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => handleChoosePlan(plan)}
                    disabled={isCurrent || isLoading}
                    className={cn(
                      'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all',
                      isCurrent
                        ? 'bg-white/5 text-gray-400 cursor-not-allowed'
                        : plan.popular
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:scale-[1.02] shadow-lg'
                          : 'glass text-white hover:bg-white/10',
                    )}
                  >
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                    {isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        Plan actuel
                      </>
                    ) : (
                      'Choisir'
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ─── Credit packs ──────────────────────────────────────────── */}
        {user?.plan !== 'enterprise' && (
          <section className="mb-10" aria-labelledby="packs-title">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <h2 id="packs-title" className="text-lg font-bold">Recharger des crédits</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Besoin de plus de crédits ce mois-ci ? Achetez un pack à usage illimité dans le temps.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CREDIT_PACKS.map((pack) => {
                const isLoading = loadingItem === `pack-${pack.id}`;
                return (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'card-premium flex flex-col',
                      pack.popular && 'ring-2 ring-amber-500/40',
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">Pack</p>
                        <p className="text-2xl font-bold gradient-text mt-0.5">
                          {formatNumber(pack.credits)}
                        </p>
                        <p className="text-xs text-gray-400">crédits</p>
                      </div>
                      {pack.discount > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          -{pack.discount}%
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <span className="text-xl font-bold">{pack.price.toFixed(2)} $</span>
                      <span className="text-xs text-gray-400"> / unique</span>
                    </div>

                    {pack.popular && (
                      <p className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider mb-3">
                        ★ Meilleure valeur
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => handleBuyPack(pack)}
                      disabled={isLoading}
                      className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-60 disabled:hover:scale-100"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      Acheter
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Billing history (empty) ───────────────────────────────── */}
        <section aria-labelledby="billing-title">
          <div className="flex items-center gap-2 mb-5">
            <Receipt className="w-5 h-5 text-gray-400" aria-hidden="true" />
            <h2 id="billing-title" className="text-lg font-bold">Historique de facturation</h2>
          </div>
          <div className="glass rounded-2xl p-8 border border-white/5">
            <EmptyState
              icon={Receipt}
              title="Aucune facture pour le moment"
              description="Vos factures apparaîtront ici après votre premier paiement."
              gradient="from-slate-500 to-gray-600"
            />
          </div>
        </section>

        {/* Helper link */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            Besoin d&apos;aide ?{' '}
            <Link href="/dashboard/billing" className="text-indigo-400 hover:underline">
              Consultez la facturation
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
