// AfriLaunch AI — Marquee des plans d'abonnement (bande défilante infinie)
'use client';

import { Check, Star, Zap, Crown, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlanCard {
  name: string;
  price: string;
  period: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  glow: string;
  popular?: boolean;
  features: string[];
}

const PLANS: PlanCard[] = [
  {
    name: 'Starter',
    price: '5 000',
    period: 'FCFA/mois',
    icon: Zap,
    color: 'text-cyan-300',
    bg: 'from-cyan-500/10 to-blue-500/5',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20',
    features: ['13 agents IA', 'Site web basique', '2 réseaux sociaux', '500 crédits/mois'],
  },
  {
    name: 'Pro',
    price: '15 000',
    period: 'FCFA/mois',
    icon: Star,
    color: 'text-violet-300',
    bg: 'from-violet-500/15 to-fuchsia-500/10',
    border: 'border-violet-500/40',
    glow: 'shadow-violet-500/30',
    popular: true,
    features: ['Tout Starter +', 'Site premium + domaine', '5 réseaux sociaux', '5 000 crédits/mois', 'WhatsApp Agent IA'],
  },
  {
    name: 'Business',
    price: '40 000',
    period: 'FCFA/mois',
    icon: Crown,
    color: 'text-amber-300',
    bg: 'from-amber-500/10 to-orange-500/5',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
    features: ['Tout Pro +', 'Site e-commerce', '6 réseaux sociaux', '50 000 crédits/mois', 'Multi-utilisateurs (20)'],
  },
  {
    name: 'Enterprise',
    price: '150 000',
    period: 'FCFA/mois',
    icon: Building2,
    color: 'text-emerald-300',
    bg: 'from-emerald-500/10 to-teal-500/5',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
    features: ['Tout Business +', 'Agents illimités', 'Infrastructure dédiée', 'SLA 99.99%', 'Support 24/7'],
  },
];

export function PlansMarquee() {
  // Duplique les plans pour un défilement infini seamless
  const doubled = [...PLANS, ...PLANS, ...PLANS];

  return (
    <section id="plans-marquee" className="py-14 overflow-hidden relative" aria-label="Plans d'abonnement">
      {/* Heading */}
      <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-semibold text-violet-300 mb-3"
        >
          💎 Tarifs en FCFA
        </motion.span>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Des plans pour <span className="text-shimmer">chaque ambition</span>
        </h2>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Paiement Mobile Money (MTN, Orange, Wave) ou virement. Activation en 24h. Sans engagement.
        </p>
      </div>

      {/* Bande défilante */}
      <div className="relative">
        {/* Fades gauche/droite */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050508] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050508] to-transparent z-10 pointer-events-none" />

        <div className="flex gap-5 animate-marquee marquee-pause w-max">
          {doubled.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <div
                key={`${plan.name}-${i}`}
                className={`group relative w-[300px] flex-shrink-0 p-6 rounded-2xl bg-gradient-to-br ${plan.bg} backdrop-blur-sm border ${plan.border} shadow-xl ${plan.glow} transition-all duration-300 hover:scale-105 hover:-translate-y-2`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white shadow-lg shadow-violet-500/40 animate-bounce-subtle">
                    ⭐ POPULAIRE
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${plan.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-bold ${plan.color} uppercase tracking-wider`}>{plan.name}</span>
                </div>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-[11px] text-gray-500">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2 list-none p-0 m-0">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
                      <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.color}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {/* Effet de brillance au hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicateur "scroll horizontal" */}
      <div className="flex items-center justify-center gap-2 mt-8 text-xs text-gray-500">
        <span className="animate-bounce-subtle">←</span>
        <span>Défilement automatique · Survolez pour pause</span>
        <span className="animate-bounce-subtle">→</span>
      </div>
    </section>
  );
}
