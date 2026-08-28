// AfriLaunch AI — Pricing Section
'use client';

import { motion } from 'framer-motion';
import { Check, Zap, Crown, Building2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PLANS, formatFCFA, type PlanId, type Plan } from '@/lib/user-types';

interface DisplayPlan {
  id: PlanId;
  name: string;
  icon: typeof Zap;
  description: string;
  color: string;
  features: string[];
  cta: string;
  popular: boolean;
}

const displayPlans: DisplayPlan[] = [
  {
    id: 'starter',
    name: PLANS.starter.name,
    icon: Zap,
    description: 'Pour les entrepreneurs ambitieux',
    color: 'from-blue-500 to-cyan-600',
    features: PLANS.starter.features,
    cta: 'Démarrer en Starter',
    popular: false,
  },
  {
    id: 'pro',
    name: PLANS.pro.name,
    icon: Crown,
    description: 'La puissance totale pour croître',
    color: 'from-indigo-500 to-violet-600',
    features: PLANS.pro.features,
    cta: 'Commencer en Pro',
    popular: true,
  },
  {
    id: 'business',
    name: PLANS.business.name,
    icon: Building2,
    description: 'Pour les équipes et agences',
    color: 'from-violet-500 to-purple-600',
    features: PLANS.business.features,
    cta: 'Choisir Business',
    popular: false,
  },
  {
    id: 'enterprise',
    name: PLANS.enterprise.name,
    icon: Sparkles,
    description: 'Pour les grandes entreprises',
    color: 'from-amber-500 to-yellow-600',
    features: PLANS.enterprise.features,
    cta: 'Contacter les ventes',
    popular: false,
  },
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <section id="tarifs" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Des tarifs <span className="gradient-text">accessibles</span>
            <br />pour chaque entrepreneur
          </h2>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-3">
            Payez en FCFA par Mobile Money ou virement bancaire.
          </p>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto mb-10">
            Annulez quand vous voulez. Activation en 24h après paiement Mobile Money.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center glass rounded-2xl p-1.5">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                billingCycle === 'monthly'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200',
              )}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2',
                billingCycle === 'annual'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200',
              )}
            >
              Annuel
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayPlans.map((plan, i) => {
            const planData: Plan = PLANS[plan.id];
            const displayPrice = billingCycle === 'monthly'
              ? planData.priceMonthly
              : Math.round(planData.priceAnnual / 12);
            const annualSavings = planData.priceMonthly * 12 - planData.priceAnnual;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                className={cn(
                  'relative glass rounded-3xl p-6 flex flex-col border transition-all duration-300',
                  plan.popular
                    ? 'border-indigo-500/50 bg-indigo-500/5 scale-105 z-10'
                    : 'border-white/5 hover:border-white/10',
                )}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r
                                     from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                      ⭐ LE PLUS POPULAIRE
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color}
                                  flex items-center justify-center mb-4 shadow-lg`}>
                    <plan.icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-end gap-1 flex-wrap">
                    <span className="text-3xl font-bold gradient-text">
                      {formatFCFA(displayPrice)}
                    </span>
                    <span className="text-gray-400 mb-1 text-sm">/mois</span>
                  </div>
                  {billingCycle === 'annual' && annualSavings > 0 && (
                    <p className="text-emerald-400 text-xs mt-1">
                      Économisez {formatFCFA(annualSavings)} / an
                    </p>
                  )}
                  {billingCycle === 'monthly' && (
                    <p className="text-gray-500 text-xs mt-1">
                      Facturé mensuellement en FCFA
                    </p>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href={`/dashboard/payment-manual?item=${plan.id}&type=plan`}
                  className={cn(
                    'w-full py-3 rounded-xl font-semibold text-center text-sm mb-8 transition-all',
                    plan.popular
                      ? `bg-gradient-to-r ${plan.color} text-white hover:opacity-90 shadow-lg shadow-indigo-500/25`
                      : 'glass border border-white/10 hover:bg-white/10 text-white',
                  )}
                >
                  {plan.cta}
                </Link>

                {/* Features */}
                <ul className="space-y-3 flex-1 list-none p-0 m-0">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Payment methods note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 glass rounded-2xl p-5 border border-white/5 text-center"
        >
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-white">Méthodes de paiement :</span>{' '}
            MTN Mobile Money, Orange Money, Virement bancaire (Cameroun).
            Activation sous 24h après téléversement du justificatif.
          </p>
        </motion.div>

        {/* Enterprise callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 glass rounded-2xl p-8 text-center border border-white/5"
        >
          <h3 className="text-xl font-bold mb-2">Besoin d&apos;une offre sur mesure ?</h3>
          <p className="text-gray-400 mb-6">
            Déploiement sur site, SLA personnalisé, intégrations sur mesure et formation.
            Pour les grandes entreprises et institutions.
          </p>
          <Link
            href="/dashboard/payment-manual?item=enterprise&type=plan"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold
                       glass border border-white/10 hover:bg-white/10 transition-all"
          >
            Parler à un expert
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
