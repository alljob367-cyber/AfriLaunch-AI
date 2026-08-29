// AfriLaunch AI — DashboardPreview (mockup desktop flottant avec sidebar + widgets)
'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard, Palette, Globe, PenSquare, Share2, Bot,
  CreditCard, BarChart3, Settings, Search, Bell, TrendingUp,
  Youtube, Instagram, FileText, Check, Sparkles,
} from 'lucide-react';
import { Logo } from '@/components/logo';

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Accueil', active: true },
  { icon: Bot, label: 'Agents' },
  { icon: Palette, label: 'Identité' },
  { icon: Globe, label: 'Site web' },
  { icon: PenSquare, label: 'Contenu' },
  { icon: Share2, label: 'Réseaux' },
  { icon: CreditCard, label: 'Paiements' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Settings, label: 'Réglages' },
];

const KPIS = [
  { label: 'Revenus', value: '12 450€', delta: '+18%', color: 'text-emerald-400', icon: CreditCard },
  { label: 'Visiteurs', value: '8 620', delta: '+12%', color: 'text-cyan-400', icon: TrendingUp },
  { label: 'Projets', value: '24', delta: '+3', color: 'text-violet-400', icon: Palette },
  { label: 'Clients', value: '14', delta: '+2', color: 'text-amber-400', icon: Bot },
];

const ACTIVITY = [
  { icon: Youtube, label: 'Vidéo YouTube générée', time: 'il y a 2h', color: 'text-red-400' },
  { icon: Instagram, label: 'Post Instagram publié', time: 'il y a 4h', color: 'text-pink-400' },
  { icon: FileText, label: 'Facture #1245 payée', time: 'il y a 6h', color: 'text-emerald-400' },
  { icon: Bot, label: 'Nouveau client via Agent', time: 'hier', color: 'text-violet-400' },
];

export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateY: -10 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ delay: 0.4, duration: 0.8, type: 'spring', stiffness: 60, damping: 14 }}
      whileHover={{ y: -8, rotateY: -4, rotateX: 2 }}
      style={{ transformStyle: 'preserve-3d' }}
      className="relative w-full max-w-2xl mx-auto"
    >
      {/* Glow arrière */}
      <div className="absolute -inset-4 -z-10 bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-cyan-500/20 blur-3xl rounded-3xl animate-glow-pulse" />

      <div className="rounded-2xl bg-[#0a0a1a] border border-white/10 shadow-2xl shadow-indigo-500/30 overflow-hidden">
        {/* Top bar (fake browser) */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-black/30">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/5 text-[10px] text-gray-400 max-w-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              app.afrilaunch.ai/dashboard
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex h-[420px]">
          {/* Sidebar */}
          <aside className="w-44 border-r border-white/5 bg-black/20 p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <Logo size={20} compact />
              <span className="text-xs font-bold text-white">AfriLaunch <span className="gradient-text">AI</span></span>
            </div>
            {SIDEBAR_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${
                    item.active
                      ? 'bg-gradient-to-r from-indigo-500/30 to-violet-500/20 text-white border border-indigo-500/30'
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </motion.div>
              );
            })}
          </aside>

          {/* Main */}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Top header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-gray-500">Tableau de bord</p>
                <h3 className="text-sm font-bold text-white">Bienvenue, Mohamed 👋</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 text-[10px] text-gray-400">
                  <Search className="w-3 h-3" /> Rechercher...
                </div>
                <div className="relative w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                  <Bell className="w-3 h-3 text-gray-400" />
                  <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-rose-500" />
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {KPIS.map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="p-2 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Icon className={`w-2.5 h-2.5 ${kpi.color}`} />
                      <span className="text-[8px] text-gray-500 uppercase">{kpi.label}</span>
                    </div>
                    <p className="text-xs font-bold text-white">{kpi.value}</p>
                    <p className={`text-[9px] ${kpi.color}`}>{kpi.delta}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Two columns: Agent IA + Activity */}
            <div className="grid grid-cols-2 gap-3">
              {/* Agent IA */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 }}
                className="p-3 rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 border border-violet-500/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0a0a1a]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-white">Agent Branding</p>
                    <p className="text-[8px] text-emerald-300">● Actif maintenant</p>
                  </div>
                  <Sparkles className="w-3 h-3 text-violet-300 animate-bounce-subtle" />
                </div>
                <div className="p-2 rounded-md bg-black/30">
                  <p className="text-[9px] text-white/70">"Voici 3 concepts de logo pour votre marque..."</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} className="w-1 h-1 rounded-full bg-violet-400" />
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 rounded-full bg-violet-400" />
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 rounded-full bg-violet-400" />
                  </div>
                </div>
                <button type="button" className="w-full mt-2 py-1 rounded-md bg-gradient-to-r from-violet-500 to-fuchsia-500 text-[9px] font-bold text-white">
                  Discuter avec l'agent
                </button>
              </motion.div>

              {/* Activité récente */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 }}
                className="p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <p className="text-[10px] font-bold text-white mb-2">Activité récente</p>
                <div className="space-y-1.5">
                  {ACTIVITY.map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.6 + i * 0.15 }}
                        className="flex items-center gap-1.5"
                      >
                        <Icon className={`w-2.5 h-2.5 ${a.color} flex-shrink-0`} />
                        <span className="text-[9px] text-white/70 flex-1 truncate">{a.label}</span>
                        <span className="text-[8px] text-gray-500">{a.time}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
              className="mt-3 p-2 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-gray-400">Progression projet "Refonte branding"</span>
                <span className="text-[9px] text-violet-300 font-bold">85%</span>
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ delay: 2, duration: 1.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Particules décoratives */}
      <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-cyan-400 animate-float-medium" />
      <div className="absolute -bottom-3 -left-3 w-2.5 h-2.5 rounded-full bg-violet-400 animate-float-slow" />
      <div className="absolute top-1/3 -right-4 w-2 h-2 rounded-full bg-emerald-400 animate-float-medium" />
    </motion.div>
  );
}
