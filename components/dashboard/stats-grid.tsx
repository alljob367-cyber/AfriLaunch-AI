// AfriLaunch AI — Stats Grid Component
'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Eye, Share2, MousePointer } from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon registry — allows `useStats()` to return string keys instead of
// component references (which would break React serialization in some cases).
const ICON_MAP = {
  eye: Eye,
  users: Users,
  share: Share2,
  click: MousePointer,
} as const;

export type StatIcon = keyof typeof ICON_MAP;

export interface Stat {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: StatIcon;
  color: string;
  gradient: string;
}

interface StatsGridProps {
  stats?: {
    metrics?: Stat[];
  };
}

const defaultStats: Stat[] = [
  {
    label: 'Portée totale',
    value: '24,891',
    change: +18.2,
    changeLabel: 'vs mois dernier',
    icon: 'eye',
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-blue-600/5',
  },
  {
    label: 'Abonnés cumulés',
    value: '3,247',
    change: +12.5,
    changeLabel: 'vs mois dernier',
    icon: 'users',
    color: 'text-violet-500',
    gradient: 'from-violet-500/20 to-violet-600/5',
  },
  {
    label: 'Interactions',
    value: '1,089',
    change: +8.7,
    changeLabel: 'vs mois dernier',
    icon: 'share',
    color: 'text-cyan-500',
    gradient: 'from-cyan-500/20 to-cyan-600/5',
  },
  {
    label: 'Clics site web',
    value: '542',
    change: -3.1,
    changeLabel: 'vs mois dernier',
    icon: 'click',
    color: 'text-green-500',
    gradient: 'from-green-500/20 to-green-600/5',
  },
];

export function StatsGrid({ stats }: StatsGridProps) {
  // Use passed stats if available, otherwise fall back to defaults.
  const displayStats = stats?.metrics ?? defaultStats;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {displayStats.map((stat, i) => {
        const Icon = ICON_MAP[stat.icon] ?? Eye;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
            className={cn(
              'card-premium group cursor-default',
              'bg-gradient-to-br',
              stat.gradient,
            )}
          >
            {/* Icon */}
            <div className={cn('p-2.5 rounded-xl bg-background/40 w-fit mb-4', stat.color)}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Value */}
            <div className="mb-1">
              <span className="text-2xl font-bold tabular-nums tracking-tight">
                {stat.value}
              </span>
            </div>

            {/* Label */}
            <p className="text-sm text-muted-foreground mb-3">{stat.label}</p>

            {/* Change */}
            <div className="flex items-center gap-1">
              {stat.change >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className={cn(
                'text-xs font-semibold',
                stat.change >= 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {stat.change >= 0 ? '+' : ''}{stat.change}%
              </span>
              <span className="text-xs text-muted-foreground">{stat.changeLabel}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
