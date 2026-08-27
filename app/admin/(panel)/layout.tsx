// AfriLaunch AI — Admin layout (sidebar + auth guard)
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, Settings, Database, Bot, CreditCard, Share2, Mail,
  HardDrive, Webhook, ToggleLeft, FileText, Users, LogOut,
  Loader2, Rocket, Send, Megaphone, Calculator, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';

const navItems = [
  { href: '/admin/general', label: 'Général', icon: Settings, color: 'text-slate-400' },
  { href: '/admin/database', label: 'Base de données', icon: Database, color: 'text-blue-400' },
  { href: '/admin/ai', label: 'IA & LLM', icon: Bot, color: 'text-violet-400' },
  { href: '/admin/payments', label: 'Paiements', icon: CreditCard, color: 'text-teal-400' },
  { href: '/admin/payments-manual', label: 'Paiements manuels', icon: Wallet, color: 'text-emerald-400' },
  { href: '/admin/social', label: 'Réseaux sociaux', icon: Share2, color: 'text-green-400' },
  { href: '/admin/ads', label: 'Publicités & IA', icon: Megaphone, color: 'text-orange-400' },
  { href: '/admin/email', label: 'Email & Notifications', icon: Mail, color: 'text-amber-400' },
  { href: '/admin/storage', label: 'Stockage', icon: HardDrive, color: 'text-cyan-400' },
  { href: '/admin/webhooks', label: 'Webhooks & API', icon: Webhook, color: 'text-pink-400' },
  { href: '/admin/telegram', label: 'Telegram Bot', icon: Send, color: 'text-sky-400' },
  { href: '/admin/features', label: 'Feature flags', icon: ToggleLeft, color: 'text-amber-400' },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users, color: 'text-indigo-400' },
  { href: '/admin/metrics', label: 'Métriques financières', icon: Calculator, color: 'text-green-400' },
  { href: '/admin/logs', label: 'Logs', icon: FileText, color: 'text-gray-400' },
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    fetch('/api/admin/auth', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          router.replace('/admin/login');
        } else {
          setAuthenticated(true);
        }
        setAuthChecked(true);
      })
      .catch(() => {
        router.replace('/admin/login');
        setAuthChecked(true);
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth?action=logout', { method: 'POST', credentials: 'include' });
    toast({ title: 'Déconnecté', description: 'Session admin terminée', variant: 'success' });
    router.replace('/admin/login');
  };

  if (!authChecked || !authenticated) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-gray-500">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 border-r border-white/5 glass flex flex-col transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Navigation admin"
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <Link href="/admin/general" className="flex items-center gap-2" aria-label="Accueil admin">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-sm">AfriLaunch Admin</p>
              <p className="text-[10px] text-gray-500">Panneau de configuration</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <ul className="space-y-0.5 list-none p-0 m-0">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-gradient-to-r from-red-500/20 to-orange-500/10 text-white border border-red-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-red-400' : item.color)} aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-white/5 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Rocket className="w-4 h-4" aria-hidden="true" />
            Retour à l'app
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Ouvrir le menu"
          className="p-2 rounded-lg glass hover:bg-white/10"
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
        </button>
        <span className="font-bold text-sm">Admin</span>
        <div className="w-8" aria-hidden="true" />
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-72 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
