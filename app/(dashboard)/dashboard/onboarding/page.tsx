// AfriLaunch AI — Onboarding module (0% progress)
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Rocket, ArrowRight, Building2, Palette, Globe, Share2,
  PenSquare, CreditCard, Bot, Megaphone, BarChart3, Users,
  type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  { id: 1, title: 'Créer votre organisation', description: 'Renseignez le nom, le pays et la description de votre business.', href: '/dashboard/organization', icon: Building2 },
  { id: 2, title: 'Générer votre identité', description: 'Lancez le Branding Agent pour obtenir nom, logo et palette.', href: '/dashboard/identity', icon: Palette },
  { id: 3, title: 'Lancer votre site web', description: 'Déployez votre vitrine en ligne en un clic avec l\'IA.', href: '/dashboard/website', icon: Globe },
  { id: 4, title: 'Connecter les réseaux sociaux', description: 'Reliez Instagram, TikTok, WhatsApp Business et plus encore.', href: '/dashboard/social', icon: Share2 },
  { id: 5, title: 'Créer votre premier contenu', description: 'Générez un post, un reel ou une newsletter avec l\'IA.', href: '/dashboard/content', icon: PenSquare },
  { id: 6, title: 'Activer les paiements', description: 'Connectez Mobile Money, cartes bancaires et PayPal.', href: '/dashboard/payments', icon: CreditCard },
  { id: 7, title: 'Lancer un agent IA', description: 'Activez votre premier agent et exécutez une tâche automatisée.', href: '/dashboard/agents', icon: Bot },
  { id: 8, title: 'Planifier une campagne', description: 'Créez votre première campagne publicitaire optimisée par l\'IA.', href: '/dashboard/campaigns', icon: Megaphone },
  { id: 9, title: 'Configurer l\'analytics', description: 'Suivez votre portée, engagement et ROI en temps réel.', href: '/dashboard/analytics', icon: BarChart3 },
  { id: 10, title: 'Inviter votre équipe', description: 'Ajoutez vos collaborateurs et attribuez-leur un rôle.', href: '/dashboard/team', icon: Users },
];

const TOTAL_STEPS = 10;
const COMPLETED_STEPS = 0;
const PROGRESS_PERCENT = 0;

export default function OnboardingPage() {
  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Onboarding"
          description="Complétez votre profil pour débloquer tous les agents IA et fonctionnalités d'AfriLaunch AI."
          icon={Rocket}
          gradient="from-indigo-500 to-violet-600"
        />

        {/* Progress overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium mb-10 flex flex-col sm:flex-row items-center gap-8"
          aria-labelledby="progress-title"
        >
          <div className="relative w-32 h-32 flex-shrink-0" role="img" aria-label={`${PROGRESS_PERCENT}% du parcours complété`}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-white/10" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#onbGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="0 326.73"
              />
              <defs>
                <linearGradient id="onbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgb(99,102,241)" />
                  <stop offset="100%" stopColor="rgb(139,92,246)" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold tabular-nums">{PROGRESS_PERCENT}%</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">complété</span>
            </span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 id="progress-title" className="text-xl font-bold mb-1">Votre parcours d&apos;onboarding</h2>
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-white">{COMPLETED_STEPS}/{TOTAL_STEPS} étapes complétées</span>.
              Commencez par créer votre organisation pour débloquer toute la puissance d&apos;AfriLaunch AI.
            </p>
          </div>
        </motion.section>

        {/* Onboarding steps timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          aria-labelledby="steps-title"
        >
          <header className="flex items-center gap-2 mb-6">
            <Rocket className="w-5 h-5 text-indigo-400" aria-hidden="true" />
            <h2 id="steps-title" className="text-xl font-bold">Étapes d&apos;onboarding</h2>
          </header>
          <ol className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-500/50 via-violet-500/30 to-transparent" aria-hidden="true" />
            {steps.map((step, i) => (
              <motion.li
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="relative pl-12 pb-5 last:pb-0"
              >
                <div
                  className={cn(
                    'absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2',
                    'bg-transparent border-indigo-500/50 glass'
                  )}
                  aria-hidden="true"
                >
                  <step.icon className="w-5 h-5 text-indigo-300" />
                </div>
                <div className="glass rounded-2xl p-4 border border-white/5 hover:border-white/15 transition-all duration-300 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 tabular-nums">{step.id}.</span>
                      <h3 className="font-semibold text-sm">{step.title}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                  </div>
                  <Link
                    href={step.href}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:scale-105 transition-transform"
                  >
                    Commencer <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </motion.li>
            ))}
          </ol>
        </motion.section>
      </div>
    </div>
  );
}
