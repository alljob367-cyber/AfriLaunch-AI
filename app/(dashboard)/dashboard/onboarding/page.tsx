// AfriLaunch AI — Onboarding module
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Rocket, Check, ArrowRight, Building2, Palette, Globe, Share2,
  PenSquare, CreditCard, Bot, Megaphone, BarChart3, Users,
  MessageCircle, Sparkles, Calendar, type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  completed: boolean;
}

const steps: Step[] = [
  { id: 1, title: 'Créer votre organisation', description: 'Renseignez le nom, le pays et la description de votre business.', href: '/dashboard/organization', icon: Building2, completed: true },
  { id: 2, title: 'Générer votre identité', description: 'Lancez le Branding Agent pour obtenir nom, logo et palette.', href: '/dashboard/identity', icon: Palette, completed: true },
  { id: 3, title: 'Lancer votre site web', description: 'Déployez votre vitrine en ligne en un clic avec l\'IA.', href: '/dashboard/website', icon: Globe, completed: false },
  { id: 4, title: 'Connecter les réseaux sociaux', description: 'Reliez Instagram, TikTok, WhatsApp Business et plus encore.', href: '/dashboard/social', icon: Share2, completed: false },
  { id: 5, title: 'Créer votre premier contenu', description: 'Générez un post, un reel ou une newsletter avec l\'IA.', href: '/dashboard/content', icon: PenSquare, completed: false },
  { id: 6, title: 'Activer les paiements', description: 'Connectez Mobile Money, cartes bancaires et PayPal.', href: '/dashboard/payments', icon: CreditCard, completed: false },
  { id: 7, title: 'Lancer un agent IA', description: 'Activez votre premier agent et exécutez une tâche automatisée.', href: '/dashboard/agents', icon: Bot, completed: false },
  { id: 8, title: 'Planifier une campagne', description: 'Créez votre première campagne publicitaire optimisée par l\'IA.', href: '/dashboard/campaigns', icon: Megaphone, completed: false },
  { id: 9, title: 'Configurer l\'analytics', description: 'Suivez votre portée, engagement et ROI en temps réel.', href: '/dashboard/analytics', icon: BarChart3, completed: false },
  { id: 10, title: 'Inviter votre équipe', description: 'Ajoutez vos collaborateurs et attribuez-leur un rôle.', href: '/dashboard/team', icon: Users, completed: false },
];

const recommended = [
  {
    id: 'whatsapp',
    title: 'Connecter WhatsApp Business',
    description: 'Débloquez la boîte de réception unifiée et le Support Agent sur le canal n°1 en Afrique.',
    cta: 'Connecter WhatsApp',
    icon: MessageCircle,
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 'branding',
    title: 'Lancer le Branding Agent',
    description: 'Obtenez 4 variants de logo et une charte graphique complète en moins de 2 minutes.',
    cta: 'Lancer l\'agent',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'schedule',
    title: 'Programmer 7 posts IA',
    description: 'Générez et planifiez une semaine de contenu sur tous vos réseaux en un clic.',
    cta: 'Programmer',
    icon: Calendar,
    color: 'from-pink-500 to-rose-600',
  },
];

const TOTAL_STEPS = 10;
const COMPLETED_STEPS = steps.filter((s) => s.completed).length;
const PROGRESS_PERCENT = Math.round((COMPLETED_STEPS / TOTAL_STEPS) * 100);

export default function OnboardingPage() {
  const { toast } = useToast();

  const handleRecommended = (rec: typeof recommended[number]) => {
    toast({
      title: rec.title,
      description: `Action recommandée démarrée : ${rec.cta}.`,
      variant: 'success',
    });
  };

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
              <motion.circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#onbGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 326.73' }}
                animate={{ strokeDasharray: `${PROGRESS_PERCENT * 3.2673} 326.73` }}
                transition={{ duration: 1, ease: 'easeOut' }}
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
              Continuez pour débloquer toute la puissance d&apos;AfriLaunch AI.
            </p>
          </div>
        </motion.section>

        {/* Onboarding steps timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
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
                    step.completed
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-transparent'
                      : 'bg-transparent border-indigo-500/50 glass'
                  )}
                  aria-hidden="true"
                >
                  {step.completed ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <step.icon className="w-5 h-5 text-indigo-300" />
                  )}
                </div>
                <div className="glass rounded-2xl p-4 border border-white/5 hover:border-white/15 transition-all duration-300 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 tabular-nums">{step.id}.</span>
                      <h3 className="font-semibold text-sm">{step.title}</h3>
                      {step.completed && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-400">
                          <Check className="w-3 h-3" aria-hidden="true" /> Complété
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                  </div>
                  {step.completed ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 cursor-default"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" /> ✓ Complété
                    </button>
                  ) : (
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:scale-105 transition-transform"
                    >
                      Commencer <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </motion.li>
            ))}
          </ol>
        </motion.section>

        {/* Recommended next steps */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          aria-labelledby="recommended-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-indigo-400" aria-hidden="true" />
            <h2 id="recommended-title" className="text-xl font-bold">Prochaines étapes recommandées</h2>
          </header>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recommended.map((rec, i) => (
              <motion.li
                key={rec.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-white/15 transition-all duration-300 flex flex-col"
              >
                <div className={cn('w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg mb-4', rec.color)}>
                  <rec.icon className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-base mb-2">{rec.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-5 flex-1">{rec.description}</p>
                <button
                  type="button"
                  onClick={() => handleRecommended(rec)}
                  className={cn('w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r text-white hover:scale-[1.02] transition-transform shadow-lg', rec.color)}
                >
                  {rec.cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </motion.li>
            ))}
          </ul>
        </motion.section>
      </div>
    </div>
  );
}
