// AfriLaunch AI — Onboarding Banner
'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Rocket } from 'lucide-react';
import Link from 'next/link';

interface OnboardingBannerProps {
  progress: number; // 0-100
}

export function OnboardingBanner({ progress }: OnboardingBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative glass rounded-3xl p-6 overflow-hidden border border-indigo-500/30"
    >
      {/* Gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-transparent" />
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative z-10 flex items-center gap-6 flex-wrap">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <Rocket className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Onboarding
            </span>
          </div>
          <h3 className="font-bold text-lg mb-1">
            Complétez votre profil pour débloquer tous les agents IA
          </h3>
          <p className="text-sm text-muted-foreground">
            Plus votre profil est complet, plus nos agents IA sont pertinents.
          </p>

          {/* Progress bar */}
          <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-600"
            />
          </div>
        </div>

        <Link
          href="/dashboard/onboarding"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm
                     bg-gradient-to-r from-indigo-500 to-violet-600 text-white
                     hover:scale-105 transition-transform shadow-lg shadow-indigo-500/30"
        >
          Continuer
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
