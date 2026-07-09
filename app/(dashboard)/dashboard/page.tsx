// AfriLaunch AI — Dashboard Principal
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Rocket, TrendingUp, Users, Globe, Zap, ArrowRight,
  CheckCircle2, Circle, ChevronRight, Sparkles, Bell,
  BarChart3, PieChart, Activity, Star, Crown, Target,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/header';
import { ProgressChecklist } from '@/components/dashboard/progress-checklist';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { AIRecommendations } from '@/components/dashboard/ai-recommendations';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { SocialAccountsWidget } from '@/components/dashboard/social-accounts-widget';
import { ContentCalendar } from '@/components/dashboard/content-calendar';
import { OnboardingBanner } from '@/components/dashboard/onboarding-banner';
import { useOrganization } from '@/hooks/use-organization';
import { useStats } from '@/hooks/use-stats';
import { useDashboardData } from '@/hooks/use-dashboard-data';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

export default function DashboardPage() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const { stats } = useStats();
  const { checklist, recommendations, recentActivity } = useDashboardData();
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bonjour');
    else if (hour < 18) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');
  }, []);

  const completedSteps = checklist?.filter((item: any) => item.completed).length ?? 0;
  const totalSteps = checklist?.length ?? 10;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="min-h-screen mesh-bg">
      {/* Background Aurora */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-purple-500/8 blur-3xl animate-aurora delay-300" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-cyan-500/8 blur-3xl animate-aurora delay-500" />
      </div>

      <div className="relative z-10 p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">👋</span>
                <h1 className="text-2xl font-bold text-foreground" suppressHydrationWarning>
                  {greeting ?? 'Bonjour'},{' '}
                  <span className="gradient-text">
                    {organization?.members?.[0]?.user?.firstName ?? 'Entrepreneur'}
                  </span>
                </h1>
              </div>
              <p className="text-muted-foreground text-sm">
                Votre empire digital vous attend —{' '}
                <span className="text-primary font-medium">
                  {progressPercent}% de votre profil complété
                </span>
              </p>
            </div>

            {/* Quick Stats Pills */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="glass rounded-full px-4 py-2 flex items-center gap-2 text-sm">
                <div className="status-dot active" />
                <span className="text-muted-foreground">Plateforme active</span>
              </div>
              <div className="glass rounded-full px-4 py-2 flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{stats?.aiCredits ?? 100} crédits IA</span>
              </div>
              <button className="glass rounded-full p-2 relative hover:scale-105 transition-transform">
                <Bell className="w-5 h-5" />
                {stats?.unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {stats.unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Onboarding Banner (si nouvelle inscription) */}
        {progressPercent < 30 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <OnboardingBanner progress={progressPercent} />
          </motion.div>
        )}

        {/* Main Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-12 gap-6"
        >
          {/* Stats Row */}
          <motion.div variants={itemVariants} className="col-span-12">
            <StatsGrid stats={stats} />
          </motion.div>

          {/* Progress Checklist */}
          <motion.div variants={itemVariants} className="col-span-12 lg:col-span-4">
            <div className="card-premium h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Votre parcours
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {completedSteps}/{totalSteps} étapes complétées
                  </p>
                </div>
                <div className="relative w-14 h-14">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor"
                      className="text-border" strokeWidth="4" />
                    <circle cx="28" cy="28" r="24" fill="none"
                      stroke="url(#progressGrad)" strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${progressPercent * 1.508} 150.8`} />
                    <defs>
                      <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(99,102,241)" />
                        <stop offset="100%" stopColor="rgb(139,92,246)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {progressPercent}%
                  </span>
                </div>
              </div>
              <ProgressChecklist items={checklist} />
            </div>
          </motion.div>

          {/* AI Recommendations */}
          <motion.div variants={itemVariants} className="col-span-12 lg:col-span-8">
            <div className="card-premium h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  Recommandations IA
                </h2>
                <span className="badge-new">Mis à jour</span>
              </div>
              <AIRecommendations recommendations={recommendations} />
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="col-span-12">
            <div className="card-premium">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-yellow-500" />
                Actions rapides
              </h2>
              <QuickActions />
            </div>
          </motion.div>

          {/* Social Accounts Widget */}
          <motion.div variants={itemVariants} className="col-span-12 lg:col-span-6">
            <div className="card-premium h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-500" />
                  Réseaux sociaux
                </h2>
                <button className="text-sm text-primary hover:underline flex items-center gap-1">
                  Gérer <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <SocialAccountsWidget />
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants} className="col-span-12 lg:col-span-6">
            <div className="card-premium h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  Activités récentes
                </h2>
              </div>
              <RecentActivity items={recentActivity} />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
