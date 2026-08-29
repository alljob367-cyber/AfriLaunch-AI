// AfriLaunch AI — FloatingModules : 8 modules qui flottent autour du hero
'use client';

import { motion } from 'framer-motion';
import {
  Palette, Globe, PenSquare, Share2, CreditCard, MessageCircle,
  BarChart3, Bot, type LucideIcon,
} from 'lucide-react';

interface FloatingModule {
  icon: LucideIcon;
  label: string;
  color: string;
  bg: string;
  // position relative to center (% of container)
  top: string;
  left: string;
  delay: number;
  floatClass: string;
}

const MODULES: FloatingModule[] = [
  { icon: Palette,    label: 'Identité',   color: 'text-violet-300',  bg: 'from-violet-500/20 to-fuchsia-500/10',  top: '8%',  left: '5%',  delay: 0,    floatClass: 'animate-float-slow' },
  { icon: Globe,      label: 'Site web',   color: 'text-blue-300',    bg: 'from-blue-500/20 to-cyan-500/10',       top: '15%', left: '88%', delay: 0.4,  floatClass: 'animate-float-medium' },
  { icon: PenSquare,  label: 'Contenu',    color: 'text-pink-300',    bg: 'from-pink-500/20 to-rose-500/10',       top: '50%', left: '0%',  delay: 0.8,  floatClass: 'animate-float-slow' },
  { icon: Share2,     label: 'Réseaux',    color: 'text-emerald-300', bg: 'from-emerald-500/20 to-green-500/10',   top: '88%', left: '8%',  delay: 0.2,  floatClass: 'animate-float-medium' },
  { icon: CreditCard, label: 'Paiements',  color: 'text-teal-300',    bg: 'from-teal-500/20 to-cyan-500/10',       top: '92%', left: '85%', delay: 0.6,  floatClass: 'animate-float-slow' },
  { icon: MessageCircle, label: 'WhatsApp',color: 'text-green-300',   bg: 'from-green-500/20 to-lime-500/10',      top: '55%', left: '92%', delay: 1.0,  floatClass: 'animate-float-medium' },
  { icon: BarChart3,  label: 'Analytics',  color: 'text-sky-300',     bg: 'from-sky-500/20 to-blue-500/10',        top: '4%',  left: '45%', delay: 0.5,  floatClass: 'animate-float-medium' },
  { icon: Bot,        label: 'Agents IA',  color: 'text-indigo-300',  bg: 'from-indigo-500/20 to-violet-500/10',   top: '80%', left: '45%', delay: 0.7,  floatClass: 'animate-float-slow' },
];

export function FloatingModules() {
  return (
    <div className="absolute inset-0 pointer-events-none hidden lg:block" aria-hidden="true">
      {MODULES.map((mod, i) => {
        const Icon = mod.icon;
        return (
          <motion.div
            key={mod.label}
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.6 + mod.delay, type: 'spring', stiffness: 100, damping: 12 }}
            className={`absolute ${mod.floatClass}`}
            style={{ top: mod.top, left: mod.left }}
          >
            <motion.div
              whileHover={{ scale: 1.15, rotate: 6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              className="group flex flex-col items-center gap-1.5 pointer-events-auto cursor-pointer"
            >
              <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.bg} backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${mod.color}`} />
                {/* Pulse ring au hover */}
                <span className="absolute inset-0 rounded-2xl border border-white/30 opacity-0 group-hover:opacity-100 group-hover:animate-pulse-ring" />
              </div>
              <span className="text-[10px] font-bold text-white/70 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
                {mod.label}
              </span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
