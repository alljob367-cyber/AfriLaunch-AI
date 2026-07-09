// AfriLaunch AI — Mode indicator (shows DEMO/REAL badge in the main app)
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppMode {
  mode: 'demo' | 'real';
  appName: string;
}

export function ModeIndicator() {
  const [mode, setMode] = useState<AppMode | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Fetch config without auth — the API returns mode even unauthenticated
    // via a public endpoint. We'll fetch from the admin config and handle 401 gracefully.
    fetch('/api/admin/mode', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.mode) setMode({ mode: data.mode, appName: data.appName || 'AfriLaunch AI' });
        else setMode({ mode: 'demo', appName: 'AfriLaunch AI' });
      })
      .catch(() => setMode({ mode: 'demo', appName: 'AfriLaunch AI' }));
  }, []);

  if (!mode) return null;

  const isReal = mode.mode === 'real';

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <Link
        href="/admin/general"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={() => setExpanded(false)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-full border shadow-lg transition-all duration-300 group',
          isReal
            ? 'bg-green-500/15 border-green-500/40 hover:bg-green-500/25'
            : 'bg-amber-500/15 border-amber-500/40 hover:bg-amber-500/25',
        )}
        aria-label={`Mode ${isReal ? 'réel' : 'démo'} — cliquer pour configurer`}
      >
        <div className={cn(
          'w-2 h-2 rounded-full',
          isReal ? 'bg-green-500 animate-pulse' : 'bg-amber-500',
        )} aria-hidden="true" />
        {isReal ? <Shield className="w-3.5 h-3.5 text-green-400" aria-hidden="true" /> : <Zap className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />}
        <span className={cn(
          'text-[11px] font-bold uppercase tracking-wide whitespace-nowrap overflow-hidden transition-all',
          expanded ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0',
        )}>
          {isReal ? 'Mode Réel' : 'Mode Démo'}
        </span>
        {!isReal && expanded && (
          <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" aria-hidden="true" />
        )}
      </Link>
    </div>
  );
}
