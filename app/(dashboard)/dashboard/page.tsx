// AfriLaunch AI — Dashboard Principal
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Globe, Zap, ChevronRight, Sparkles, Bell, Activity, Target, Calendar as CalendarIcon,
} from 'lucide-react';

import { ProgressChecklist, type ChecklistItem } from '@/components/dashboard/progress-checklist';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { RecentActivity, type ActivityItem } from '@/components/dashboard/recent-activity';
import { AIRecommendations, type Recommendation } from '@/components/dashboard/ai-recommendations';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { SocialAccountsWidget } from '@/components/dashboard/social-accounts-widget';
import { ContentCalendar } from '@/components/dashboard/content-calendar';
import { OnboardingBanner } from '@/components/dashboard/onboarding-banner';
import { useAuth } from '@/components/providers/auth-provider';
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
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { stats } = useStats();
  const { checklist, recommendations, recentActivity } = useDashboardData<{
    checklist: ChecklistItem[];
    recommendations: Recommendation[];
    recentActivity: ActivityItem[];
  }>();
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bonjour');
    else if (hour < 18) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');
  }, []);

  const completedSteps = checklist?.filter((item) => item.completed).length ?? 0;
  const totalSteps = checklist?.length ?? 10;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  // Prefer the logged-in user's first name; fall back to the mock org member.
  const displayName = user?.firstName ?? organization?.members?.[0]?.user?.firstName ?? 'Entrepreneur';

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
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl" role="img" aria-label="Bonjour">👋</span>
                <h1 className="text-2xl font-bold text-foreground" suppressHydrationWarning>
                  {greeting ?? 'Bonjour'},{' '}
                  <span className="gradient-text">{displayName}</span>
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
                <div className="status-dot active" aria-hidden="true" />
                <span className="text-muted-foreground">Plateforme active</span>
              </div>
              <div className="glass rounded-full px-4 py-2 flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                <span className="font-medium">{stats?.aiCredits ?? 100} crédits IA</span>
              </div>
              <button
                type="button"
                aria-label={`${stats?.unreadNotifications ?? 0} notifications non lues`}
                className="glass rounded-full p-2 relative hover:scale-105 transition-transform"
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {(stats?.unreadNotifications ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {stats.unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.header>

        {/* Onboarding Banner (visible tant que le profil est < 50% complété) */}
        {progressPercent < 50 && (
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
          <motion.section variants={itemVariants} className="col-span-12 lg:col-span-4">
            <div className="card-premium h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" aria-hidden="true" />
                    Votre parcours
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {completedSteps}/{totalSteps} étapes complétées
                  </p>
                </div>
                <div className="relative w-14 h-14" role="img" aria-label={`${progressPercent}% complété`}>
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
          </motion.section>

          {/* AI Recommendations */}
          <motion.section variants={itemVariants} className="col-span-12 lg:col-span-8">
            <div className="card-premium h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-500" aria-hidden="true" />
                  Recommandations IA
                </h2>
                <span className="badge-new">Mis à jour</span>
              </div>
              <AIRecommendations recommendations={recommendations} />
            </div>
          </motion.section>

          {/* Quick Actions */}
          <motion.section variants={itemVariants} className="col-span-12">
            <div className="card-premium">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-yellow-500" aria-hidden="true" />
                Actions rapides
              </h2>
              <QuickActions />
            </div>
          </motion.section>

          {/* Social Accounts Widget */}
          <motion.section variants={itemVariants} className="col-span-12 lg:col-span-6">
            <div className="card-premium h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-500" aria-hidden="true" />
                  Réseaux sociaux
                </h2>
                <button
                  type="button"
                  aria-label="Gérer les réseaux sociaux"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Gérer <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <SocialAccountsWidget />
            </div>
          </motion.section>

          {/* Recent Activity */}
          <motion.section variants={itemVariants} className="col-span-12 lg:col-span-6">
            <div className="card-premium h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" aria-hidden="true" />
                  Activités récentes
                </h2>
              </div>
              <RecentActivity items={recentActivity} />
            </div>
          </motion.section>

          {/* Content Calendar */}
          <motion.section variants={itemVariants} className="col-span-12">
            <div className="card-premium">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-pink-500" aria-hidden="true" />
                  Calendrier de contenu
                </h2>
              </div>
              <ContentCalendar />
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
