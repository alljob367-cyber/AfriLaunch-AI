// AfriLaunch AI — Analytics module
'use client';

import { motion } from 'framer-motion';
import {
  BarChart3, Eye, Heart, Target, TrendingUp, Sparkles, Flame,
  Instagram, Youtube, Facebook, Twitter, Linkedin, type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface PlatformPerf {
  id: string;
  name: string;
  icon: LucideIcon;
  reach: number;
  reachLabel: string;
  engagement: number;
  color: string;
}

interface StatCard {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  tint: string;
}

const stats: StatCard[] = [
  { label: 'Portée totale', value: '48 920', delta: '+18,2 %', icon: Eye, tint: 'text-sky-400' },
  { label: 'Engagement', value: '8,7 %', delta: '+2,1 pp', icon: Heart, tint: 'text-blue-400' },
  { label: 'Conversions', value: '342', delta: '+12,5 %', icon: Target, tint: 'text-cyan-400' },
  { label: 'ROI', value: '3,4x', delta: '+0,8', icon: TrendingUp, tint: 'text-indigo-400' },
];

const reachBars: { day: string; height: number }[] = [
  { day: 'L', height: 55 },
  { day: 'M', height: 70 },
  { day: 'J', height: 45 },
  { day: 'V', height: 80 },
  { day: 'S', height: 60 },
  { day: 'D', height: 90 },
  { day: 'L', height: 50 },
];

const platforms: PlatformPerf[] = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, reach: 24891, reachLabel: '24 891', engagement: 8.2, color: 'from-fuchsia-500 to-pink-600' },
  { id: 'tiktok', name: 'TikTok', icon: Youtube, reach: 18420, reachLabel: '18 420', engagement: 12.4, color: 'from-slate-700 to-black' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, reach: 4210, reachLabel: '4 210', engagement: 3.1, color: 'from-blue-600 to-blue-700' },
  { id: 'twitter', name: 'Twitter / X', icon: Twitter, reach: 1180, reachLabel: '1 180', engagement: 1.8, color: 'from-gray-700 to-gray-900' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, reach: 640, reachLabel: '640', engagement: 5.2, color: 'from-sky-600 to-blue-700' },
];

const maxReach = Math.max(...platforms.map((p) => p.reach));

const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const slots = ['9h', '12h', '15h', '19h'];

// Engagement grid: rows = days, columns = slots. Values 0-100.
const engagementGrid: number[][] = [
  [20, 45, 30, 55], // Lundi
  [25, 50, 35, 60], // Mardi
  [30, 55, 40, 70], // Mercredi
  [35, 60, 50, 95], // Jeudi  ← best at 19h
  [20, 45, 35, 65], // Vendredi
  [15, 40, 55, 80], // Samedi
  [10, 30, 40, 50], // Dimanche
];

const BEST_DAY_INDEX = 3; // Jeudi
const BEST_SLOT_INDEX = 3; // 19h

function cellColor(value: number): string {
  // Interpolate between gray-600 (75,85,99) and blue-500 (59,130,246).
  const t = Math.min(Math.max(value, 0), 100) / 100;
  const r = Math.round(75 + (59 - 75) * t);
  const g = Math.round(85 + (130 - 85) * t);
  const b = Math.round(99 + (246 - 99) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function AnalyticsPage() {
  const { toast } = useToast();

  const handlePredict = () => {
    toast({
      title: 'Analyse prédictive lancée',
      description: 'L\'Analytics Agent calcule vos meilleurs créneaux pour la semaine prochaine.',
      variant: 'success',
    });
  };

  const handleExport = () => {
    toast({
      title: 'Rapport PDF généré',
      description: 'Le rapport analytique a été téléchargé.',
      variant: 'success',
    });
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-blue-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Analytics"
          description="Suivez portée, engagement, conversions et ROI. L'IA prédit vos meilleurs moments de publication."
          icon={BarChart3}
          gradient="from-sky-500 to-blue-600"
          action={
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold glass hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" /> Exporter
            </button>
          }
        />

        {/* Stats row */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          aria-label="Statistiques analytiques"
        >
          {stats.map((s) => (
            <div key={s.label} className="card-premium">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={cn('w-4 h-4', s.tint)} aria-hidden="true" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="text-xs text-emerald-400 font-semibold mt-1">{s.delta}</p>
            </div>
          ))}
        </motion.section>

        {/* Reach evolution */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium mb-10"
          aria-labelledby="reach-title"
        >
          <header className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-400" aria-hidden="true" />
              <h2 id="reach-title" className="text-xl font-bold">Évolution de la portée</h2>
            </div>
            <span className="text-xs text-gray-400">7 derniers jours</span>
          </header>
          <div className="h-48 flex items-end justify-between gap-3" role="img" aria-label="Histogramme de la portée sur 7 jours">
            {reachBars.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${bar.height}%` }}
                  transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 120, damping: 20 }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-sky-600 to-blue-400 min-h-[4px]"
                />
                <span className="text-xs text-gray-400 font-semibold">{bar.day}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Platform performance */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
          aria-labelledby="platforms-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-sky-400" aria-hidden="true" />
            <h2 id="platforms-title" className="text-xl font-bold">Performance par plateforme</h2>
          </header>
          <ul className="space-y-3">
            {platforms.map((p, i) => {
              const percent = Math.round((p.reach / maxReach) * 100);
              return (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4 border border-white/5 hover:border-white/15 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow flex-shrink-0', p.color)}>
                      <p.icon className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{p.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="tabular-nums">{p.reachLabel} portée</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-sky-400">
                            <Heart className="w-3 h-3" aria-hidden="true" /> {p.engagement.toString().replace('.', ',')} %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Portée relative ${p.name}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                      className={cn('h-full rounded-full bg-gradient-to-r', p.color)}
                    />
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </motion.section>

        {/* Best publishing times heatmap */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-premium"
          aria-labelledby="heatmap-title"
        >
          <header className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-sky-400" aria-hidden="true" />
              <h2 id="heatmap-title" className="text-xl font-bold">Meilleures heures de publication</h2>
            </div>
            <button
              type="button"
              onClick={handlePredict}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:scale-105 transition-transform shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Prédire la semaine
            </button>
          </header>
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[480px]">
              {/* Header row */}
              <div className="grid grid-cols-5 gap-2 mb-2">
                <div />
                {slots.map((slot) => (
                  <div key={slot} className="text-center text-xs font-semibold text-gray-400">{slot}</div>
                ))}
              </div>
              {/* Grid rows */}
              {days.map((day, dayIndex) => (
                <div key={day} className="grid grid-cols-5 gap-2 mb-2">
                  <div className="flex items-center text-xs font-semibold text-gray-400 pr-2 justify-end">{day}</div>
                  {slots.map((slot, slotIndex) => {
                    const value = engagementGrid[dayIndex][slotIndex];
                    const isBest = dayIndex === BEST_DAY_INDEX && slotIndex === BEST_SLOT_INDEX;
                    return (
                      <div
                        key={slot}
                        className={cn(
                          'relative h-12 rounded-lg flex items-center justify-center text-xs font-bold transition-transform hover:scale-105',
                          isBest ? 'ring-2 ring-sky-300 ring-offset-2 ring-offset-transparent' : ''
                        )}
                        style={{ backgroundColor: cellColor(value), color: value > 50 ? 'white' : 'rgba(255,255,255,0.7)' }}
                        title={`${day} ${slot} — ${value}% d'engagement`}
                      >
                        {isBest ? (
                          <span className="badge-new absolute -top-2 -right-2 text-[10px] whitespace-nowrap">Pic</span>
                        ) : null}
                        <span aria-hidden="true">{value}</span>
                        <span className="sr-only">{day} à {slot} : {value} pour cent d'engagement{isBest ? ', pic d\'engagement' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            Meilleur créneau : <span className="font-semibold text-white">Jeudi 19h</span>
            <span className="badge-new">Pic d&apos;engagement</span>
          </p>
        </motion.section>
      </div>
    </div>
  );
}
