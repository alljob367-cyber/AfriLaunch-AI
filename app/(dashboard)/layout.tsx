// AfriLaunch AI — Dashboard Layout (sidebar + header)
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Rocket, LayoutDashboard, Palette, Globe, PenSquare, Share2,
  Bot, Megaphone, CreditCard, BarChart3, Users, Settings,
  ChevronRight, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { useOrganization } from '@/hooks/use-organization';

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
    ],
  },
  {
    label: 'Croissance',
    items: [
      { href: '/dashboard/social', label: 'Réseaux sociaux', icon: Share2 },
      { href: '/dashboard/campaigns', label: 'Campagnes', icon: Megaphone },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/dashboard/agents', label: 'Agents IA', icon: Bot },
      { href: '/dashboard/payments', label: 'Paiements', icon: CreditCard },
      { href: '/dashboard/team', label: 'Équipe', icon: Users },
      { href: '/dashboard/organization', label: 'Organisation', icon: Settings },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { organization } = useOrganization();

  const orgName = organization?.name ?? 'Mon organisation';
  const initials = orgName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

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
          <button
            type="button"
            className="w-full flex items-center gap-3 p-2.5 rounded-xl glass hover:bg-white/10 transition-colors text-left"
            aria-label="Changer d'organisation"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{orgName}</p>
              <p className="text-[10px] text-gray-500">Plan Pro · 5/10 sites</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" aria-hidden="true" />
          </button>
        </div>

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
              {(user?.firstName ?? 'U')[0].toUpperCase()}
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
        {children}
      </main>
    </div>
  );
}
