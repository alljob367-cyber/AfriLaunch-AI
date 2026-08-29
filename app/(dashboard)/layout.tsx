// AfriLaunch AI — Dashboard Layout (sidebar + header)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Rocket, LayoutDashboard, Palette, Globe, PenSquare, Share2,
  Bot, Megaphone, CreditCard, BarChart3, Users, Settings,
  ChevronRight, Sparkles, Store, Gift, Send, Inbox, Wallet, Mic, Loader2, Check, X, MessageCircle, Youtube,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { useOrganization } from '@/hooks/use-organization';
import { useBackgroundJobs } from '@/hooks/use-background-jobs';
import { AICoworker } from '@/components/dashboard/ai-coworker';

const navSections = [
  {
    label: 'Pilotage',
    items: [
      { href: '/dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Création',
    items: [
      { href: '/dashboard/identity', label: 'Identité de marque', icon: Palette },
      { href: '/dashboard/website', label: 'Site web', icon: Globe },
      { href: '/dashboard/content', label: 'Contenu', icon: PenSquare },
      { href: '/dashboard/youtube', label: 'YouTube', icon: Youtube, color: 'text-red-400' },
      { href: '/dashboard/voice', label: 'Voix IA', icon: Mic },
    ],
  },
  {
    label: 'Croissance',
    items: [
      { href: '/dashboard/social', label: 'Réseaux sociaux', icon: Share2 },
      { href: '/dashboard/campaigns', label: 'Campagnes', icon: Megaphone },
      { href: '/dashboard/ads-inbox', label: 'Boîte Ads IA', icon: Inbox },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/dashboard/agents', label: 'Agents IA', icon: Bot },
      { href: '/dashboard/whatsapp-agent', label: 'Agent WhatsApp', icon: MessageCircle, color: 'text-green-400' },
      { href: '/dashboard/payments', label: 'Paiements', icon: CreditCard },
      { href: '/dashboard/payment-manual', label: 'Paiement manuel', icon: Wallet },
      { href: '/dashboard/team', label: 'Équipe', icon: Users },
      { href: '/dashboard/organization', label: 'Organisation', icon: Settings },
      { href: '/dashboard/subscription', label: 'Abonnement', icon: CreditCard, color: 'text-indigo-400' },
      { href: '/dashboard/marketplace', label: 'Marketplace', icon: Store, color: 'text-pink-400' },
      { href: '/dashboard/referral', label: 'Parrainage', icon: Gift, color: 'text-emerald-400' },
      { href: '/dashboard/telegram-link', label: 'Lier Telegram', icon: Send, color: 'text-sky-400' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { organization, isLoading: orgLoading } = useOrganization();
  const { activeJobs } = useBackgroundJobs();

  // PAYMENT WALL — block the entire dashboard if user hasn't paid
  // (the /dashboard/subscription page is exempt so they can pay)
  const isOnSubscriptionPage = pathname === '/dashboard/subscription';
  const planStatus = (user as any)?.planStatus as string | undefined;
  const isAdmin = (user as any)?.isAdmin === true || user?.email === 'admin@albermon.com' || user?.email === 'admin@afrilaunch.ai';
  const needsPayment = !isAdmin && planStatus === 'pending_payment' && !isOnSubscriptionPage;

  const orgName = organization?.name ?? 'Mon organisation';
  const initials = (orgName || 'MO')
    .split(' ')
    .slice(0, 2)
    .map((w) => (w && w[0]) ? w[0] : '')
    .join('')
    .toUpperCase() || 'MO';

  return (
    <div className="min-h-screen bg-[#050508] text-white flex">
      {/* Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 border-r border-white/5 glass fixed inset-y-0 left-0 z-30"
        aria-label="Navigation tableau de bord"
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2" aria-label="Accueil AfriLaunch AI">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold">AfriLaunch <span className="gradient-text">AI</span></span>
          </Link>
        </div>

        {/* Org switcher */}
        <div className="p-4 border-b border-white/5">
          <Link
            href="/dashboard/organization"
            className="w-full flex items-center gap-3 p-2.5 rounded-xl glass hover:bg-white/10 transition-colors text-left"
            aria-label="Gérer l'organisation"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{orgName}</p>
              <p className="text-[10px] text-gray-500">
                {organization ? `${organization.industry || 'Business'} · ${organization.country}` : 'Non configurée'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" aria-hidden="true" />
          </Link>
        </div>

        {/* No org banner */}
        {!organization && !orgLoading && (
          <div className="p-3 border-b border-white/5">
            <Link href="/dashboard/organization" className="block p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 hover:bg-amber-500/15 transition-colors">
              <div className="flex items-start gap-2">
                <Rocket className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span><strong>Créez votre organisation</strong> pour débloquer tous les outils.</span>
              </div>
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold px-3 mb-2">
                {section.label}
              </p>
              <ul className="space-y-0.5 list-none p-0 m-0">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                          isActive
                            ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white border border-indigo-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5',
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 p-2 rounded-xl glass">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-xs">
              {((user?.firstName ?? 'U')[0] || 'U').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.firstName ?? 'Entrepreneur'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Se déconnecter"
              className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Accueil AfriLaunch AI">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Rocket className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          </div>
          <span className="font-bold text-sm">AfriLaunch <span className="gradient-text">AI</span></span>
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg glass"
        >
          Vue d&apos;ensemble
        </Link>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        {needsPayment ? <PaymentWall /> : children}
      </main>

      {/* Background jobs indicator (floating, bottom-right) — hidden when payment wall is shown */}
      {!needsPayment && activeJobs.length > 0 && <BackgroundJobsIndicator jobs={activeJobs} />}

      {/* AI Coworker — flottant sur toutes les pages dashboard — hidden when payment wall is shown */}
      {!needsPayment && <AICoworker />}
    </div>
  );
}

// ─── Payment Wall ─────────────────────────────────────────────────────
// Full-screen overlay shown when user.planStatus === 'pending_payment'.
// The user can only navigate to /dashboard/subscription to pay.
function PaymentWall() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl animate-aurora" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-violet-500/8 blur-3xl animate-aurora delay-300" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 glass rounded-3xl p-8 border border-amber-500/30 max-w-md w-full text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg mx-auto mb-5">
          <Wallet className="w-8 h-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Abonnement requis 🔒</h1>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Bienvenue sur AfriLaunch AI ! Pour utiliser la plateforme, souscrivez un abonnement.
          <br />
          À partir de <strong className="text-amber-300">5 000 FCFA / mois</strong>.
        </p>
        <Link
          href="/dashboard/subscription"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:scale-[1.02] transition-transform shadow-lg w-full justify-center"
        >
          <Wallet className="w-4 h-4" aria-hidden="true" />
          Souscrire un abonnement
        </Link>
        <p className="text-[10px] text-gray-600 mt-4">
          Paiement Mobile Money (MTN, Orange, Wave) ou virement bancaire.
          <br />
          Activation manuelle par notre équipe sous 24h.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Background Jobs Indicator ─────────────────────────────────────────
function BackgroundJobsIndicator({ jobs }: { jobs: any[] }) {
  const [expanded, setExpanded] = useState(false);
  const label = jobs.length === 1
    ? (jobs[0].type === 'website' ? 'Génération site web'
      : jobs[0].type === 'identity' ? 'Génération identité'
      : 'Génération contenu')
    : `${jobs.length} générations en cours`;

  return (
    <div className="fixed bottom-4 right-4 z-40 lg:bottom-6 lg:right-6">
      <div className="glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 transition-colors w-full"
          aria-expanded={expanded}
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" aria-hidden="true" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{label}</p>
            <p className="text-[10px] text-gray-500">
              {jobs.length === 1 && jobs[0].elapsed
                ? `${jobs[0].elapsed}s écoulées${jobs[0].partialLength ? ` · ${jobs[0].partialLength.toLocaleString('fr-FR')} car.` : ''}`
                : 'Travail en arrière-plan'}
            </p>
          </div>
          {expanded ? <X className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" /> : null}
        </button>
        {expanded && (
          <div className="border-t border-white/5 p-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
            {jobs.map((job) => {
              const target = job.type === 'website' ? '/dashboard/website'
                : job.type === 'identity' ? '/dashboard/identity'
                : '/dashboard/content';
              const jobLabel = job.type === 'website' ? 'Site web'
                : job.type === 'identity' ? 'Identité de marque'
                : 'Contenu';
              return (
                <Link
                  key={job.jobId}
                  href={target}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 text-xs"
                >
                  <Loader2 className="w-3 h-3 animate-spin text-violet-400 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{jobLabel}</p>
                    {job.partialLength ? (
                      <p className="text-[10px] text-gray-500">
                        {job.partialLength.toLocaleString('fr-FR')} caractères générés
                      </p>
                    ) : null}
                  </div>
                  {job.elapsed ? <span className="text-[10px] text-gray-500">{job.elapsed}s</span> : null}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
