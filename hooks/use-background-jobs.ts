// AfriLaunch AI — Background jobs hook
// Persists active async AI jobs (website/identity/content generation) in
// localStorage so they survive navigation. Polls each active job every 3s,
// shows a toast when it completes, and exposes the list to any component.
//
// Usage:
//   1. In the dashboard layout (global): const { jobs } = useBackgroundJobs();
//      — this starts the global poller.
//   2. In a page that triggers a job: const { registerJob } = useBackgroundJobs();
//      — call registerJob(jobId, type, meta) right after POST /api/ai/generate-async.
//   3. In a page that wants to display a job's result: useBackgroundJobs() and
//      filter by type — when a job's status becomes 'done', the result is
//      available in job.result.content.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/providers/toast-provider';

export interface BackgroundJob {
  jobId: string;
  type: 'website' | 'identity' | 'content';
  meta?: Record<string, any>;
  status: 'pending' | 'running' | 'done' | 'failed';
  partialLength?: number;
  elapsed?: number;
  result?: { content: string; provider?: string; model?: string };
  error?: string;
  createdAt: number;
  completedAt?: number;
}

const STORAGE_KEY = 'afrilaunch.backgroundJobs';
const MAX_JOBS = 10;
const POLL_INTERVAL_MS = 3000;
const MAX_JOB_AGE_MS = 30 * 60 * 1000; // 30 min

function readJobs(): BackgroundJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: BackgroundJob[] = JSON.parse(raw);
    // Drop old jobs
    const cutoff = Date.now() - MAX_JOB_AGE_MS;
    return parsed.filter((j) => j.createdAt >= cutoff);
  } catch {
    return [];
  }
}

function writeJobs(jobs: BackgroundJob[]) {
  if (typeof window === 'undefined') return;
  try {
    // Keep only the latest MAX_JOBS, sorted by createdAt desc
    const sorted = [...jobs].sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_JOBS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    // Broadcast a storage-like event so other hook instances in the same tab
    // can refresh (the native 'storage' event only fires in OTHER tabs).
    window.dispatchEvent(new CustomEvent('afrilaunch:jobs-updated'));
  } catch { /* ignore quota errors */ }
}

// Singleton state shared across all hook instances in the same tab.
// We use a module-level array + simple subscription model so the global
// poller (in the dashboard layout) keeps the state fresh and all other
// hook instances see updates.
let sharedJobs: BackgroundJob[] = [];
const subscribers = new Set<() => void>();

function notifyAll() {
  for (const sub of subscribers) {
    try { sub(); } catch { /* ignore */ }
  }
}

if (typeof window !== 'undefined') {
  sharedJobs = readJobs();
  // Listen for cross-tab updates
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      sharedJobs = readJobs();
      notifyAll();
    }
  });
  // Listen for same-tab updates (custom event)
  window.addEventListener('afrilaunch:jobs-updated', () => {
    sharedJobs = readJobs();
    notifyAll();
  });
}

export function useBackgroundJobs() {
  const [, forceUpdate] = useState(0);
  const { toast } = useToast();
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastToastRef = useRef<Set<string>>(new Set()); // jobIds already toasted

  const subscribe = useCallback(() => forceUpdate((n) => n + 1), []);

  useEffect(() => {
    subscribers.add(subscribe);
    return () => { subscribers.delete(subscribe); };
  }, [subscribe]);

  // Start the poller — only one instance per tab is needed; we use a ref
  // check to make sure subsequent hook instances don't start duplicates.
  useEffect(() => {
    if (pollerRef.current) return;
    pollerRef.current = setInterval(async () => {
      const active = sharedJobs.filter(
        (j) => j.status === 'pending' || j.status === 'running',
      );
      if (active.length === 0) return;

      let anyChanged = false;
      await Promise.all(active.map(async (job) => {
        try {
          const res = await fetch(`/api/ai/generate-async?jobId=${job.jobId}`, {
            credentials: 'include',
          });
          if (!res.ok) return;
          const data = await res.json();
          if (data.status !== job.status || data.partialLength !== job.partialLength) {
            job.status = data.status;
            job.partialLength = data.partialLength;
            job.elapsed = data.elapsed;
            anyChanged = true;
          }
          if (data.status === 'done' && data.result) {
            job.result = data.result;
            job.completedAt = Date.now();
            anyChanged = true;
            if (!lastToastRef.current.has(job.jobId)) {
              lastToastRef.current.add(job.jobId);
              const label = job.type === 'website' ? 'Site web' : job.type === 'identity' ? 'Identité de marque' : 'Contenu';
              toast({
                title: `${label} prêt ! ✅`,
                description: `Génération terminée en ${data.elapsed}s`,
                variant: 'success',
              });
            }
          } else if (data.status === 'failed') {
            job.error = data.error;
            job.completedAt = Date.now();
            anyChanged = true;
            if (!lastToastRef.current.has(job.jobId)) {
              lastToastRef.current.add(job.jobId);
              const label = job.type === 'website' ? 'Site web' : job.type === 'identity' ? 'Identité de marque' : 'Contenu';
              toast({
                title: `${label} échoué`,
                description: data.error || 'Erreur inconnue',
                variant: 'error',
              });
            }
          }
        } catch { /* network error — retry next tick */ }
      }));

      if (anyChanged) {
        writeJobs(sharedJobs);
        notifyAll();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
        pollerRef.current = null;
      }
    };
  }, [toast]);

  // Register a new job
  const registerJob = useCallback((
    jobId: string,
    type: BackgroundJob['type'],
    meta?: Record<string, any>,
  ): void => {
    const job: BackgroundJob = {
      jobId, type, meta,
      status: 'pending',
      createdAt: Date.now(),
    };
    sharedJobs = [job, ...sharedJobs.filter((j) => j.jobId !== jobId)];
    writeJobs(sharedJobs);
    notifyAll();
  }, []);

  // Manually remove a job (e.g. user dismisses it)
  const dismissJob = useCallback((jobId: string) => {
    sharedJobs = sharedJobs.filter((j) => j.jobId !== jobId);
    writeJobs(sharedJobs);
    notifyAll();
  }, []);

  return {
    jobs: sharedJobs,
    activeJobs: sharedJobs.filter((j) => j.status === 'pending' || j.status === 'running'),
    registerJob,
    dismissJob,
  };
}
