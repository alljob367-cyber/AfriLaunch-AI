// AfriLaunch AI — Onboarding progressif (stepper 1 étape à la fois)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Rocket, ArrowRight, ArrowLeft, Building2, Palette, Globe, Share2,
  PenSquare, CreditCard, Bot, Check, Loader2, Sparkles, X,
  type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  key: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  // How to check if this step is completed
  check: (data: OnboardingData) => boolean;
}

interface OnboardingData {
  hasOrg: boolean;
  hasIdentity: boolean;
  hasWebsite: boolean;
  hasSocial: boolean;
  hasContent: boolean;
  hasPayment: boolean;
  hasAgent: boolean;
}

const STEPS: Step[] = [
  {
    id: 1, key: 'hasOrg', title: 'Créez votre organisation',
    description: 'Renseignez le nom de votre business, votre pays et votre industrie. L\'IA utilisera ces infos pour personnaliser toutes ses réponses.',
    href: '/dashboard/organization', icon: Building2, color: 'from-indigo-500 to-violet-600',
    check: (d) => d.hasOrg,
  },
  {
    id: 2, key: 'hasIdentity', title: 'Générez votre identité de marque',
    description: 'Lancez le Branding Agent pour obtenir votre logo, palette de couleurs, typographie et charte graphique en 30 secondes.',
    href: '/dashboard/identity', icon: Palette, color: 'from-violet-500 to-purple-600',
    check: (d) => d.hasIdentity,
  },
  {
    id: 3, key: 'hasWebsite', title: 'Créez votre site web',
    description: 'Générez un site web professionnel en un clic. Choisissez un template, l\'IA fait le reste.',
    href: '/dashboard/website', icon: Globe, color: 'from-blue-500 to-cyan-600',
    check: (d) => d.hasWebsite,
  },
  {
    id: 4, key: 'hasSocial', title: 'Connectez vos réseaux sociaux',
    description: 'Reliez Instagram, TikTok, Facebook, WhatsApp Business, LinkedIn et X. L\'agent pourra publier automatiquement.',
    href: '/dashboard/social', icon: Share2, color: 'from-green-500 to-emerald-600',
    check: (d) => d.hasSocial,
  },
  {
    id: 5, key: 'hasContent', title: 'Créez votre premier contenu',
    description: 'Générez un post Instagram, un script TikTok ou une newsletter avec l\'IA. Personnalisé selon votre business.',
    href: '/dashboard/content', icon: PenSquare, color: 'from-pink-500 to-rose-600',
    check: (d) => d.hasContent,
  },
  {
    id: 6, key: 'hasPayment', title: 'Activez les paiements',
    description: 'Configurez Mobile Money (MTN, Orange, Wave) ou virement bancaire pour recevoir les paiements de vos clients.',
    href: '/dashboard/subscription', icon: CreditCard, color: 'from-teal-500 to-cyan-600',
    check: (d) => d.hasPayment,
  },
  {
    id: 7, key: 'hasAgent', title: 'Discutez avec un agent IA',
    description: 'Explorez vos 13 agents IA spécialisés. Posez une question au Content Agent, Branding Agent ou Growth Agent.',
    href: '/dashboard/agents', icon: Bot, color: 'from-indigo-500 to-violet-600',
    check: (d) => d.hasAgent,
  },
];

const STORAGE_KEY = 'afrilaunch.onboarding.step';

export default function OnboardingPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OnboardingData>({
    hasOrg: false, hasIdentity: false, hasWebsite: false,
    hasSocial: false, hasContent: false, hasPayment: false, hasAgent: false,
  });
  const [currentStep, setCurrentStep] = useState(0); // index in STEPS
  const [skipped, setSkipped] = useState<Set<number>>(new Set());

  // Fetch real data to detect completed steps
  const fetchProgress = useCallback(async () => {
    try {
      const [orgRes, socialRes, brandRes, sitesRes] = await Promise.all([
        fetch('/api/organization', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/social/accounts', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/brand-kit/list', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/sites/list', { credentials: 'include' }).then(r => r.json()).catch(() => null),
      ]);

      const hasOrg = !!(orgRes?.organization?.name);
      const hasSocial = !!(socialRes?.accounts?.some((a: any) => a.connected));
      const hasIdentity = !!(brandRes?.kits?.length > 0);
      const hasWebsite = !!(sitesRes?.sites?.length > 0);

      // For content/payment/agent — check localStorage (set when user visits those pages)
      const hasContent = localStorage.getItem('afrilaunch.onboarding.content') === 'done';
      const hasPayment = localStorage.getItem('afrilaunch.onboarding.payment') === 'done';
      const hasAgent = localStorage.getItem('afrilaunch.onboarding.agent') === 'done';

      setData({ hasOrg, hasIdentity, hasWebsite, hasSocial, hasContent, hasPayment, hasAgent });

      // Find the first uncompleted step
      const allData = { hasOrg, hasIdentity, hasWebsite, hasSocial, hasContent, hasPayment, hasAgent };
      const firstIncomplete = STEPS.findIndex((s) => !s.check(allData));
      setCurrentStep(firstIncomplete >= 0 ? firstIncomplete : STEPS.length - 1);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Restore last viewed step from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    fetchProgress().then(() => {
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < STEPS.length) setCurrentStep(idx);
      }
    });
  }, [fetchProgress]);

  // Save current step to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(currentStep));
  }, [currentStep]);

  const completedCount = STEPS.filter((s) => s.check(data)).length;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);
  const step = STEPS[currentStep];
  const isCompleted = step ? step.check(data) : false;
  const isLastStep = currentStep === STEPS.length - 1;
  const allDone = completedCount === STEPS.length;

  function handleNext() {
    if (isLastStep) {
      toast({ title: 'Onboarding terminé ! 🎉', description: 'Vous êtes prêt à utiliser AfriLaunch AI.', variant: 'success' });
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handlePrev() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  function handleSkip() {
    setSkipped((prev) => new Set([...prev, currentStep]));
    handleNext();
  }

  function goToStep(idx: number) {
    setCurrentStep(idx);
  }

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <ModuleHeader
          title="Onboarding"
          description="Configurez votre business étape par étape. Chaque étape dure moins de 2 minutes."
          icon={Rocket}
          gradient="from-indigo-500 to-violet-600"
        />

        {/* Progress bar */}
        <div className="card-premium p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold">
                {allDone ? '🎉 Onboarding terminé !' : `Étape ${currentStep + 1} sur ${STEPS.length}`}
              </p>
              <p className="text-xs text-gray-500">
                {completedCount}/{STEPS.length} étapes complétées · {progressPercent}%
              </p>
            </div>
            <div className="text-2xl font-bold gradient-text">{progressPercent}%</div>
          </div>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          {/* Step dots */}
          <div className="flex items-center justify-between mt-4">
            {STEPS.map((s, i) => {
              const isDone = s.check(data);
              const isCurrent = i === currentStep;
              const isSkipped = skipped.has(i);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToStep(i)}
                  className="group flex flex-col items-center gap-1 flex-1"
                  aria-label={`Étape ${s.id}: ${s.title}`}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isCurrent
                          ? 'bg-indigo-500 border-indigo-400 text-white scale-110 shadow-lg shadow-indigo-500/30'
                          : isSkipped
                            ? 'bg-gray-700 border-gray-600 text-gray-500'
                            : 'bg-transparent border-white/20 text-gray-600 group-hover:border-white/40',
                    )}
                  >
                    {isDone ? <Check className="w-4 h-4" aria-hidden="true" /> : s.id}
                  </div>
                  <span className={cn(
                    'text-[9px] text-center hidden md:block leading-tight max-w-[60px]',
                    isCurrent ? 'text-white font-semibold' : 'text-gray-600',
                  )}>
                    {s.title.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current step card */}
        <AnimatePresence mode="wait">
          {allDone ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card-premium p-8 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-5">
                <Check className="w-10 h-10 text-white" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Onboarding terminé ! 🎉</h2>
              <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                Votre business est configuré. Vous êtes prêt à utiliser toute la puissance d'AfriLaunch AI.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:scale-105 transition-transform shadow-lg"
              >
                <Rocket className="w-4 h-4" aria-hidden="true" /> Aller au dashboard
              </Link>
            </motion.div>
          ) : step && (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="card-premium overflow-hidden"
            >
              {/* Step header with gradient */}
              <div className={cn('bg-gradient-to-r p-6 flex items-center gap-4', step.color)}>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <step.icon className="w-7 h-7 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/70 uppercase tracking-widest font-semibold">
                    Étape {step.id} / {STEPS.length}
                  </p>
                  <h2 className="text-xl font-bold text-white">{step.title}</h2>
                </div>
                {isCompleted && (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* Step content */}
              <div className="p-6">
                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                  {step.description}
                </p>

                {/* Status badge */}
                {isCompleted ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-6">
                    <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <span className="text-xs text-emerald-300 font-semibold">Cette étape est complétée !</span>
                  </div>
                ) : skipped.has(currentStep) ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
                    <X className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    <span className="text-xs text-amber-300 font-semibold">Étape ignorée — vous pouvez la reprendre plus tard.</span>
                  </div>
                ) : null}

                {/* Action buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href={step.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:scale-105 transition-transform shadow-lg"
                  >
                    {isCompleted ? 'Revoir' : 'Commencer'} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold glass border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Précédent
                  </button>
                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-white transition-colors ml-auto"
                    >
                      Ignorer <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                  {isCompleted && (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-colors ml-auto"
                    >
                      Étape suivante <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Re-check button */}
                {!isCompleted && (
                  <button
                    type="button"
                    onClick={fetchProgress}
                    className="mt-4 text-xs text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    J'ai terminé cette étape — vérifier
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary of all steps */}
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Toutes les étapes</p>
          {STEPS.map((s, i) => {
            const done = s.check(data);
            const isCurrent = i === currentStep;
            const isSkipped = skipped.has(i);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goToStep(i)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                  isCurrent
                    ? 'border-indigo-500/40 bg-indigo-500/5'
                    : 'border-white/5 glass hover:border-white/15',
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  done ? 'bg-emerald-500/20' : isSkipped ? 'bg-amber-500/20' : 'bg-white/5',
                )}>
                  {done
                    ? <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    : isSkipped
                      ? <X className="w-4 h-4 text-amber-400" aria-hidden="true" />
                      : <s.icon className="w-4 h-4 text-gray-500" aria-hidden="true" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate', isCurrent && 'text-white')}>
                    {s.id}. {s.title}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{s.description}</p>
                </div>
                {done && <span className="text-[10px] font-bold text-emerald-400 flex-shrink-0">✓ Fait</span>}
                {isSkipped && !done && <span className="text-[10px] font-bold text-amber-400 flex-shrink-0">Ignoré</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
