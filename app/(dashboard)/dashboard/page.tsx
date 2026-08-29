// AfriLaunch AI — Dashboard Principal
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Globe, Zap, ChevronRight, Sparkles, Bell, Activity, Target, Calendar as CalendarIcon,
  Rocket, Palette, PenSquare, Share2, Bot, Megaphone, CreditCard, BarChart3,
  TrendingUp, MessageCircle, type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { ProgressChecklist, type ChecklistItem } from '@/components/dashboard/progress-checklist';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { RecentActivity, type ActivityItem } from '@/components/dashboard/recent-activity';
import { AIRecommendations, type Recommendation } from '@/components/dashboard/ai-recommendations';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { SocialAccountsWidget } from '@/components/dashboard/social-accounts-widget';
import { ContentCalendar } from '@/components/dashboard/content-calendar';
import { RecentDeliverables } from '@/components/dashboard/recent-deliverables';
import { OnboardingBanner } from '@/components/dashboard/onboarding-banner';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useAuth } from '@/components/providers/auth-provider';
import { useOrganization } from '@/hooks/use-organization';
import { useStats } from '@/hooks/use-stats';
import { useDashboardData } from '@/hooks/use-dashboard-data';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { stats } = useStats();
  const { checklist, recommendations, recentActivity } = useDashboardData();
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bonjour');
    else if (hour < 18) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');
  }, []);

  const completedSteps = checklist.filter((item) => item.completed).length;
  const totalSteps = checklist.length || 10;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const displayName = user?.firstName ?? 'Entrepreneur';

  const hasData = organization !== null || (stats !== null && (stats.metrics?.length ?? 0) > 0);

  return (
    <div className="min-h-screen mesh-bg">
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
                {hasData
                  ? <>Votre empire digital vous attend —{' '}
                      <span className="text-primary font-medium">{progressPercent}% de votre profil complété</span>
                    </>
                  : <>Bienvenue sur AfriLaunch AI —{' '}
                      <span className="text-primary font-medium">Configurez votre organisation pour commencer</span>
                    </>
                }
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="glass rounded-full px-4 py-2 flex items-center gap-2 text-sm">
                <div className="status-dot active" aria-hidden="true" />
                <span className="text-muted-foreground">Plateforme active</span>
              </div>
              {stats && (
                <div className="glass rounded-full px-4 py-2 flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                  <span className="font-medium">{stats.aiCredits ?? 0} crédits IA</span>
                </div>
              )}
              <button
                type="button"
                aria-label={`${stats?.unreadNotifications ?? 0} notifications non lues`}
                className="glass rounded-full p-2 relative hover:scale-105 transition-transform"
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {(stats?.unreadNotifications ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {stats?.unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.header>

        {/* Empty state when no organization/data */}
        {!hasData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass rounded-3xl p-8 border border-white/5 mb-6">
              <EmptyState
                icon={Rocket}
                title="Bienvenue ! Lancez votre business en Afrique"
                description="Vous n'avez pas encore configuré votre organisation. Créez votre organisation pour débloquer tous les outils : identité de marque, site web, agents IA, paiements et plus."
                action={{ label: 'Créer mon organisation', href: '/dashboard/organization' }}
                gradient="from-indigo-500 to-violet-600"
              />
            </div>

            {/* Quick start suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Palette, title: 'Identité de marque', desc: 'Générez logo + charte avec l\'IA', href: '/dashboard/identity', color: 'from-violet-500 to-purple-600' },
                { icon: Globe, title: 'Site web', desc: 'Landing page ou boutique en minutes', href: '/dashboard/website', color: 'from-blue-500 to-cyan-600' },
                { icon: Bot, title: 'Agents IA', desc: '13 agents spécialisés Africa', href: '/dashboard/agents', color: 'from-indigo-500 to-violet-600' },
              ].map((item, i) => (
                <motion.div key={item.href} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                  <Link href={item.href} className="block glass rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all group">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                    <p className="font-semibold text-sm mb-1">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* WhatsApp Agent banner */}
            <WhatsAppBanner />
          </motion.div>
        )}

        {/* Normal dashboard when data exists */}
        {hasData && (
          <>
            {progressPercent < 50 && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-6">
                <OnboardingBanner progress={progressPercent} />
              </motion.div>
            )}

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-12 gap-6">
              <motion.div variants={itemVariants} className="col-span-12">
                <StatsGrid stats={stats} />
              </motion.div>

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
                        <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" className="text-border" strokeWidth="4" />
                        <circle cx="28" cy="28" r="24" fill="none" stroke="url(#progressGrad)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${progressPercent * 1.508} 150.8`} />
                        <defs>
                          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgb(99,102,241)" />
                            <stop offset="100%" stopColor="rgb(139,92,246)" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{progressPercent}%</span>
                    </div>
                  </div>
                  <ProgressChecklist items={checklist} />
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="col-span-12 lg:col-span-8">
                <div className="card-premium h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-500" aria-hidden="true" />
                      Recommandations IA
                    </h2>
                  </div>
                  <AIRecommendations recommendations={recommendations} />
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="col-span-12">
                <div className="card-premium">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                    <Zap className="w-5 h-5 text-yellow-500" aria-hidden="true" />
                    Actions rapides
                  </h2>
                  <QuickActions />
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="col-span-12 lg:col-span-6">
                <div className="card-premium h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Globe className="w-5 h-5 text-cyan-500" aria-hidden="true" />
                      Réseaux sociaux
                    </h2>
                  </div>
                  <SocialAccountsWidget />
                </div>
              </motion.section>

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

              <motion.section variants={itemVariants} className="col-span-12">
                <div className="card-premium">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-500" aria-hidden="true" />
                      Livrables récents
                    </h2>
                    <Link href="/dashboard/identity" className="text-xs text-gray-400 hover:text-white">
                      Tout voir →
                    </Link>
                  </div>
                  <RecentDeliverables />
                </div>
              </motion.section>

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
          </>
        )}
      </div>
    </div>
  );
}

// WhatsApp Agent banner — shows the WhatsApp number to contact
function WhatsAppBanner() {
  const [waStatus, setWaStatus] = useState<{ enabled: boolean; whatsappLink?: string; whatsappNumber?: string; freeForAll?: boolean; userCount?: number } | null>(null);

  useEffect(() => {
    fetch('/api/whatsapp-agent/status')
      .then((r) => r.json())
      .then((data) => { if (data.enabled) setWaStatus(data); })
      .catch(() => {});
  }, []);

  if (!waStatus?.enabled) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-6 glass rounded-2xl p-5 border border-green-500/20 bg-green-500/5"
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <MessageCircle className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="font-bold text-sm">WhatsApp Agent IA disponible ! 🤖</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {waStatus.freeForAll
              ? 'Disponible pour tous — envoyez un message et l\'IA vous répond instantanément.'
              : 'Discutez avec l\'IA directement sur WhatsApp.'
            }
            {waStatus.userCount ? ` · ${waStatus.userCount} utilisateurs actifs` : ''}
          </p>
        </div>
        <a
          href={waStatus.whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 transition-transform shadow-lg"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          Discuter sur WhatsApp
        </a>
      </div>
    </motion.div>
  );
}
