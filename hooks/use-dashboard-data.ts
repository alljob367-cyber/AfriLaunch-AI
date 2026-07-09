'use client';

import { useMemo } from 'react';
import type { ChecklistItem } from '@/components/dashboard/progress-checklist';
import type { Recommendation } from '@/components/dashboard/ai-recommendations';
import type { ActivityItem } from '@/components/dashboard/recent-activity';

// Returns the dashboard data (checklist + AI recommendations + recent activity).
// In production, this would fetch from the API. Without a backend, returns empty
// arrays and the dashboard shows empty states.
export function useDashboardData<T = {
  checklist: ChecklistItem[];
  recommendations: Recommendation[];
  recentActivity: ActivityItem[];
}>(): T {
  const data = useMemo(() => ({
    checklist: [] as ChecklistItem[],
    recommendations: [] as Recommendation[],
    recentActivity: [] as ActivityItem[],
  }), []);

  return data as T;
}
