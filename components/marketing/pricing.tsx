// AfriLaunch AI — Pricing Section
'use client';

import { motion } from 'framer-motion';
import { Check, Zap, Crown, Building2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'free',
    name: 'Free',
    icon: Sparkles,
    monthlyPrice: 0,
    annualPrice: 0,
    currency: 'USD',
    description: 'Démarrez votre aventure digitale',
    color: 'from-gray-500 to-gray-600',
    features: [
      '1 organisation',
      'Identité de marque basique',
      'Logo généré par IA (1/mois)',
      '5 contenus IA/mois',
      'Landing page simple',
      'Connexion 2 réseaux sociaux',
      'Support communauté',
    ],
    limits: {
      aiCredits: 50,
      storage: '1 GB',
      websites: 1,
    },
    cta: 'Commencer gratuitement',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    monthlyPrice: 9.99,
    annualPrice: 7.99,
    currency: 'USD',
    description: 'Pour les entrepreneurs ambitieux',
    color: 'from-blue-500 to-cyan-600',
    features: [
      '2 organisations',
      'Identité de marque complète',
      'Logo illimité par IA',
      '50 contenus IA/mois',
      '3 sites web',
      'Tous les réseaux sociaux',
      '3 agents IA',
      'Planification de contenu',
      'Support email 48h',
    ],
    limits: {
      aiCredits: 500,
      storage: '10 GB',
      websites: 3,
    },
    cta: 'Essai gratuit 14 jours',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Crown,
    monthlyPrice: 29.99,
    annualPrice: 23.99,
    currency: 'USD',
    description: 'La puissance totale pour croître',
    color: 'from-indigo-500 to-violet-600',
    features: [
      '5 organisations',
      'Identité de marque premium',
      'Tout le contenu IA illimité',
      '10 sites web',
      'Tous les agents IA (13)',
      'Campagnes marketing IA',
      'Analyse avancée',
      'Cartes virtuelles',
      'Numéros virtuels',
      'Support prioritaire 24h',
      'Accès API',
    ],
    limits: {
      aiCredits: 5000,
      storage: '100 GB',
      websites: 10,
    },
    cta: 'Commencer en Pro',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    icon: Building2,
    monthlyPrice: 79.99,
    annualPrice: 63.99,
    currency: 'USD',
    description: 'Pour les équipes et agences',
    color: 'from-violet-500 to-purple-600',
    features: [
      'Organisations illimitées',
      '20 membres d\'équipe',
      'Tout Pro inclus',
      'White-label disponible',
      'Intégrations CRM',
      'Analytics avancés',
      'Manager de compte dédié',
      'SLA 99.9%',
      'Formation personnalisée',
      'Accès API complet',
    ],
    limits: {
      aiCredits: 50000,
      storage: '1 TB',
      websites: 'Illimité',
    },
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
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10">
            Commencez gratuitement. Évoluez selon vos ambitions.
            Annulez quand vous voulez.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center glass rounded-2xl p-1.5">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                billingCycle === 'monthly'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2',
                billingCycle === 'annual'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              Annuel
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
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
                  : 'border-white/5 hover:border-white/10'
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
                  <plan.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-gray-400 mb-1">/mois</span>
                  )}
                </div>
                {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                  <p className="text-green-400 text-sm mt-1">
                    Économisez ${((plan.monthlyPrice - plan.annualPrice) * 12).toFixed(0)}/an
                  </p>
                )}
              </div>

              {/* CTA */}
              <Link
                href={plan.monthlyPrice === 0 ? '/register' : `/register?plan=${plan.id}`}
                className={cn(
                  'w-full py-3 rounded-xl font-semibold text-center text-sm mb-8 transition-all',
                  plan.popular
                    ? `bg-gradient-to-r ${plan.color} text-white hover:opacity-90 shadow-lg shadow-indigo-500/25`
                    : 'glass border border-white/10 hover:bg-white/10 text-white'
                )}
              >
                {plan.cta}
              </Link>

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Enterprise callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 glass rounded-2xl p-8 text-center border border-white/5"
        >
          <h3 className="text-xl font-bold mb-2">Besoin d'une offre Enterprise ?</h3>
          <p className="text-gray-400 mb-6">
            Déploiement sur site, SLA personnalisé, intégrations sur mesure et formation.
            Pour les grandes entreprises et institutions.
          </p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold
                       glass border border-white/10 hover:bg-white/10 transition-all">
            Parler à un expert
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
