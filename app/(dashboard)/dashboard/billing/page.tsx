// AfriLaunch AI — Facturation module
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Receipt, Loader2, CreditCard, FileText, LogIn,
  ArrowRight, Wallet, AlertCircle,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';
import { PLANS, type PlanId } from '@/lib/user-types';

interface FullUser {
  id: string;
  firstName: string;
  email: string;
  plan: PlanId;
  planStatus: string;
  credits: number;
  creditsUsedThisMonth: number;
}

export default function BillingPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<FullUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setAuthError(false);
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.status === 401) {
        setAuthError(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }
      const data = await res.json();
      setUser(data.user as FullUser);
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

  function handleAddCard() {
    toast({
      title: 'Redirection vers Stripe…',
      description: 'Vous allez être redirigé pour ajouter une carte de paiement.',
      variant: 'default',
    });
  }

  // ─── States ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" aria-hidden="true" />
          <p className="text-sm text-gray-400">Chargement de la facturation…</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen mesh-bg">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-slate-500/10 blur-3xl animate-aurora" />
        </div>
        <div className="relative z-10 p-6 md:p-8 max-w-3xl mx-auto">
          <ModuleHeader
            title="Facturation"
            description="Historique de vos paiements et factures."
            icon={Receipt}
            gradient="from-slate-500 to-gray-600"
          />
          <div className="glass rounded-2xl p-8 border border-white/5">
            <EmptyState
              icon={LogIn}
              title="Connectez-vous"
              description="Vous devez être connecté pour consulter votre historique de facturation."
              action={{ label: 'Se connecter', href: '/login' }}
              gradient="from-slate-500 to-gray-600"
            />
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = PLANS[user?.plan ?? 'starter'];

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-slate-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-gray-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <ModuleHeader
          title="Facturation"
          description="Historique de vos paiements et factures."
          icon={Receipt}
          gradient="from-slate-500 to-gray-600"
        />

        {/* ─── Payment method (current plan) ────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium mb-6"
          aria-labelledby="payment-method-title"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <CreditCard className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                  Méthode de paiement
                </p>
                <h2 id="payment-method-title" className="text-base font-bold">
                  Plan {currentPlan.name}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {currentPlan.priceMonthly === 0
                    ? 'Plan courant'
                    : `${currentPlan.priceMonthly.toFixed(2)} $ / mois`}
                </p>
                {user?.planStatus && (
                  <p className="text-[11px] text-green-400 mt-1 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" aria-hidden="true" />
                    Abonnement actif
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold glass text-white hover:bg-white/10 transition-colors"
            >
              Gérer
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </motion.section>

        {/* ─── Invoices table (empty) ───────────────────────────────── */}
        <section className="mb-6" aria-labelledby="invoices-title">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-slate-400" aria-hidden="true" />
            <h2 id="invoices-title" className="text-lg font-bold">Factures</h2>
          </div>
          <div className="glass rounded-2xl p-8 border border-white/5">
            <EmptyState
              icon={Receipt}
              title="Aucune facture"
              description="Vos factures apparaîtront ici après votre premier paiement. Téléchargez-les en PDF à tout moment."
              action={{ label: 'Voir les plans', href: '/dashboard/subscription' }}
              gradient="from-slate-500 to-gray-600"
            />
          </div>
        </section>

        {/* ─── Payment methods (empty) ──────────────────────────────── */}
        <section className="mb-6" aria-labelledby="methods-title">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-slate-400" aria-hidden="true" />
            <h2 id="methods-title" className="text-lg font-bold">Moyens de paiement</h2>
          </div>
          <div className="glass rounded-2xl p-8 border border-white/5">
            <EmptyState
              icon={CreditCard}
              title="Aucune méthode de paiement"
              description="Ajoutez une carte bancaire pour activer votre abonnement et acheter des crédits IA."
              action={{ label: 'Ajouter une carte', onClick: handleAddCard }}
              gradient="from-slate-500 to-gray-600"
            />
          </div>
        </section>

        {/* Helper note */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            Pour modifier votre plan ou acheter des crédits,{' '}
            <Link href="/dashboard/subscription" className="text-slate-300 hover:underline">
              rendez-vous sur la page Abonnement
            </Link>
            .
          </span>
        </div>
      </div>
    </div>
  );
}
