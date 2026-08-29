// AfriLaunch AI — Mockup Mobile animé (téléphone flottant avec UI live)
'use client';

import { motion } from 'framer-motion';
import {
  Bot, Sparkles, Bell, CreditCard, TrendingUp, MessageCircle,
  ArrowUpRight, LayoutDashboard, Send,
} from 'lucide-react';
import { Logo } from '@/components/logo';

/**
 * Un mockup d'iPhone stylisé avec un écran d'app AfriLaunch AI live.
 * Le téléphone flotte (animate-float-slow) + tilt 3D au hover.
 * Des particules lumineuses tournent autour.
 */
export function MobileMockup() {
  return (
    <div className="relative w-[280px] h-[580px] mx-auto animate-float-slow">
      {/* Glow arrière */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-cyan-500/30 blur-3xl rounded-[3rem] animate-glow-pulse" />

      {/* Particules orbitales */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-4 w-2 h-2 rounded-full bg-cyan-400 animate-orbit" style={{ ['--orbit-r' as string]: '160px', ['--orbit-d' as string]: '18s' }} />
        <div className="absolute top-1/2 -right-4 w-2.5 h-2.5 rounded-full bg-violet-400 animate-orbit" style={{ ['--orbit-r' as string]: '170px', ['--orbit-d' as string]: '24s', animationDirection: 'reverse' }} />
        <div className="absolute bottom-1/3 -left-2 w-1.5 h-1.5 rounded-full bg-indigo-300 animate-orbit" style={{ ['--orbit-r' as string]: '150px', ['--orbit-d' as string]: '20s' }} />
      </div>

      {/* Coque téléphone */}
      <motion.div
        whileHover={{ rotateY: -8, rotateX: 4, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="relative w-full h-full rounded-[2.5rem] bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-[3px] shadow-2xl shadow-indigo-500/30 border border-white/10"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Écran */}
        <div className="relative w-full h-full rounded-[2.3rem] bg-[#0a0a1a] overflow-hidden border border-white/5">
          {/* Encoche */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-20" />

          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-2 text-[10px] text-white/70 font-semibold z-10">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <span>●●●</span>
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>

          {/* Contenu défilant */}
          <div className="absolute inset-0 pt-8 overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo size={20} compact />
                <span className="text-xs font-bold text-white">AfriLaunch <span className="gradient-text">AI</span></span>
              </div>
              <button type="button" className="relative w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-white/70" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              </button>
            </div>

            <div className="mx-3 mt-2 p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30">
              <p className="text-[10px] text-indigo-300 font-semibold mb-0.5">Bienvenue 👋</p>
              <p className="text-sm font-bold text-white mb-2">Mohamed A.</p>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '72%' }}
                    transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-indigo-400 to-violet-400"
                  />
                </div>
                <span className="text-[9px] text-white/60">72%</span>
              </div>
              <p className="text-[9px] text-white/50 mt-1">Objectif mensuel</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mx-3 mt-2">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1 mb-0.5">
                  <CreditCard className="w-3 h-3 text-emerald-400" />
                  <span className="text-[8px] text-white/50 uppercase">Revenus</span>
                </div>
                <p className="text-sm font-bold text-white">12 450€</p>
                <p className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> +18%
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-1 mb-0.5">
                  <LayoutDashboard className="w-3 h-3 text-cyan-400" />
                  <span className="text-[8px] text-white/50 uppercase">Projets</span>
                </div>
                <p className="text-sm font-bold text-white">24</p>
                <p className="text-[9px] text-cyan-400">8 actifs</p>
              </div>
            </div>

            <div className="mx-3 mt-2 p-2.5 rounded-2xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 border border-violet-500/30">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                  <span className="absolute inset-0 rounded-full border border-violet-400 animate-pulse-ring" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-white">Agent Branding</p>
                  <p className="text-[8px] text-violet-300">en train d'écrire...</p>
                </div>
                <Sparkles className="w-3 h-3 text-violet-300 animate-bounce-subtle" />
              </div>
              <div className="flex items-center gap-1 p-1.5 rounded-lg bg-black/30">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                  className="w-1.5 h-1.5 rounded-full bg-violet-400"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-violet-400"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                  className="w-1.5 h-1.5 rounded-full bg-violet-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mx-3 mt-2">
              {[
                { icon: Send, label: 'Publier', color: 'text-blue-400' },
                { icon: MessageCircle, label: 'WhatsApp', color: 'text-emerald-400' },
                { icon: ArrowUpRight, label: 'Voir +', color: 'text-violet-400' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span className="text-[8px] text-white/60">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notification push flottante */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2, duration: 0.6, type: 'spring', stiffness: 120 }}
            className="absolute top-12 left-3 right-3 p-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 z-30 flex items-center gap-2"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white truncate">Paiement reçu ✨</p>
              <p className="text-[9px] text-white/60">+15 000 FCFA · Orange Money</p>
            </div>
            <span className="text-[8px] text-white/40">maintenant</span>
          </motion.div>

          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-white/30" />
        </div>
      </motion.div>
    </div>
  );
}
