'use client';

import { useMemo } from 'react';

// Returns the current user's stats.
// In production, this would fetch from the API. Without a backend, returns null
// and the dashboard shows an empty state.
export function useStats() {
  const stats = useMemo(() => null as null | {
    aiCredits: number;
    aiCreditsUsed: number;
    aiCreditsTotal: number;
    unreadNotifications: number;
    storageUsed: number;
    storageTotal: number;
    websites: number;
    websitesTotal: number;
    agents: number;
    agentsTotal: number;
    metrics: Array<{
      label: string;
      value: string;
      change: number;
      changeLabel: string;
      icon: 'eye' | 'users' | 'share' | 'click';
      color: string;
      gradient: string;
    }>;
  }, []);

  return { stats, isLoading: false };
}
