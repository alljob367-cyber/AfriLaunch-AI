'use client';

import { type ReactNode } from 'react';

// No-op analytics provider — real implementations would forward to
// PostHog / Mixpanel / GA. Kept as a stub so the layout compiles
// and analytics calls don't crash if components use them later.
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  // eslint-disable-next-line no-console
  console.debug('[analytics]', event, properties);
}
