// AfriLaunch AI — AI Recommendations
'use client';

import { motion } from 'framer-motion';
import {
  Sparkles, TrendingUp, Clock, Target, ArrowRight, Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/dashboard/empty-state';

export interface Recommendation {
  id: string;
  category: 'growth' | 'content' | 'timing' | 'audience';
  title: string;
  rationale: string;
  expectedImpact: string;
  confidence: number; // 0-100
  action?: string;
}

interface AIRecommendationsProps {
  recommendations?: Recommendation[];
}

const categoryConfig = {
  growth: { Icon: TrendingUp, label: 'Croissance', color: 'from-green-500 to-emerald-600' },
  content: { Icon: Lightbulb, label: 'Contenu', color: 'from-pink-500 to-rose-600' },
  timing: { Icon: Clock, label: 'Timing', color: 'from-blue-500 to-cyan-600' },
  audience: { Icon: Target, label: 'Audience', color: 'from-violet-500 to-purple-600' },
} as const;

export function AIRecommendations({ recommendations }: AIRecommendationsProps) {
  const recs = recommendations;

  if (!recs || recs.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Aucune recommandation IA"
        description="Configurez un provider IA dans l'admin et lancez vos premiers agents pour recevoir des recommandations personnalisées."
        action={{ label: 'Configurer l\'IA', href: '/admin/ai' }}
        gradient="from-violet-500 to-purple-600"
      />
    );
  }

  return (
    <div className="space-y-3">
      {recs!.map((rec, i) => {
        const cfg = categoryConfig[rec.category];
        return (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="group p-4 rounded-2xl glass border border-white/5 hover:border-white/15 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              {/* Category icon */}
              <div className={cn(
                'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-lg',
                cfg.color,
              )}>
                <cfg.Icon className="w-5 h-5 text-white" />
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                      {cfg.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 font-bold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      IA · {rec.confidence}%
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-green-400 whitespace-nowrap">
                    {rec.expectedImpact}
                  </span>
                </div>

                <p className="font-semibold text-sm mb-1.5">{rec.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{rec.rationale}</p>

                {rec.action && (
                  <button className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg',
                    'bg-gradient-to-r text-white shadow-lg group-hover:scale-105 transition-transform',
                    cfg.color,
                  )}>
                    {rec.action}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
