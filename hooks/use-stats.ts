'use client';

import { useMemo } from 'react';

// Returns mock stats for the dashboard top bar / stats grid.
export function useStats() {
  const stats = useMemo(() => ({
    aiCredits: 100,
    aiCreditsUsed: 1240,
    aiCreditsTotal: 5000,
    unreadNotifications: 3,
    storageUsed: 12.4, // GB
    storageTotal: 100, // GB
    websites: 2,
    websitesTotal: 10,
    agents: 7,
    agentsTotal: 13,
    metrics: [
      {
        label: 'Portée totale',
        value: '24,891',
        change: 18.2,
        changeLabel: 'vs mois dernier',
        icon: 'eye' as const,
        color: 'text-blue-500',
        gradient: 'from-blue-500/20 to-blue-600/5',
      },
      {
        label: 'Abonnés cumulés',
        value: '48,580',
        change: 12.5,
        changeLabel: 'vs mois dernier',
        icon: 'users' as const,
        color: 'text-violet-500',
        gradient: 'from-violet-500/20 to-violet-600/5',
      },
      {
        label: 'Interactions',
        value: '3,421',
        change: 8.7,
        changeLabel: 'vs mois dernier',
        icon: 'share' as const,
        color: 'text-cyan-500',
        gradient: 'from-cyan-500/20 to-cyan-600/5',
      },
      {
        label: 'Clics site web',
        value: '1,892',
        change: -3.1,
        changeLabel: 'vs mois dernier',
        icon: 'click' as const,
        color: 'text-green-500',
        gradient: 'from-green-500/20 to-green-600/5',
      },
    ],
  }), []);

  return { stats, isLoading: false };
}
