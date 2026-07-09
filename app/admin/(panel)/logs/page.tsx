// AfriLaunch AI — Admin > Logs & Monitoring
'use client';

import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminSelect, AdminNumber,
  SaveBar, LoadingState,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';
import { cn } from '@/lib/utils';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  ts: string;
  level: LogLevel;
  message: string;
}

const LEVEL_STYLES: Record<LogLevel, { badge: string; dot: string; label: string }> = {
  debug: { badge: 'bg-gray-500/15 text-gray-400 border border-gray-500/30', dot: 'bg-gray-500', label: 'DEBUG' },
  info: { badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/30', dot: 'bg-blue-500', label: 'INFO' },
  warn: { badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30', dot: 'bg-amber-500', label: 'WARN' },
  error: { badge: 'bg-red-500/15 text-red-400 border border-red-500/30', dot: 'bg-red-500', label: 'ERROR' },
};

const MOCK_LOGS: LogEntry[] = [
  { ts: '2025-01-15 14:32:11', level: 'info', message: 'User admin@afrilaunch.ai logged in' },
  { ts: '2025-01-15 14:30:42', level: 'info', message: 'Agent Branding executed (20 credits)' },
  { ts: '2025-01-15 14:28:09', level: 'info', message: 'Payment 12,500 FCFA received via Orange Money' },
  { ts: '2025-01-15 14:25:33', level: 'info', message: 'Webhook delivered to https://app.com/hook' },
  { ts: '2025-01-15 14:21:55', level: 'warn', message: 'Rate limit exceeded for IP 1.2.3.4' },
  { ts: '2025-01-15 14:18:02', level: 'debug', message: 'Prisma query: SELECT * FROM users WHERE id=? (12ms)' },
  { ts: '2025-01-15 14:15:47', level: 'error', message: 'Failed to send email via SMTP: connection timeout' },
  { ts: '2025-01-15 14:12:18', level: 'info', message: 'Agent SEO-Optimizer executed (15 credits)' },
  { ts: '2025-01-15 14:10:03', level: 'info', message: 'New user registered: mamadou@example.com' },
  { ts: '2025-01-15 14:08:27', level: 'warn', message: 'Flutterwave webhook signature mismatch' },
  { ts: '2025-01-15 14:05:51', level: 'debug', message: 'Cache hit: config:ai (2ms)' },
  { ts: '2025-01-15 14:02:14', level: 'info', message: 'Agent Copywriter executed (20 credits)' },
  { ts: '2025-01-15 13:58:36', level: 'error', message: 'OpenAI API key invalid: 401 Unauthorized' },
  { ts: '2025-01-15 13:55:09', level: 'info', message: 'Social post published to Instagram (post_abc123)' },
  { ts: '2025-01-15 13:51:22', level: 'warn', message: 'Disk usage above 80% on /var/log' },
];

export default function AdminLogsPage() {
  const { config, loading, saving, save } = useConfig();
  const [draft, setDraft] = useState<typeof config>(null);

  useEffect(() => { if (config && !draft) setDraft(config); }, [config, draft]);

  if (loading || !draft) return <LoadingState />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);

  const handleSave = async () => {
    await save({ logging: draft.logging });
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gray-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="Logs & Monitoring"
          description="Niveau de logs, rétention et visualisation des derniers événements."
          icon={FileText}
          color="from-gray-500 to-slate-600"
        />

        <div className="space-y-6">
          {/* Configuration */}
          <AdminCard title="Configuration" description="Niveau de verbosité et durée de rétention">
            <div className="space-y-4">
              <AdminSelect
                label="Niveau de logs"
                value={draft.logging.level}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    logging: { ...draft.logging, level: v as typeof draft.logging.level },
                  })
                }
                options={[
                  { value: 'debug', label: 'Debug (très verbeux — dev only)' },
                  { value: 'info', label: 'Info (défaut — production)' },
                  { value: 'warn', label: 'Warn (avertissements seulement)' },
                  { value: 'error', label: 'Error (erreurs seulement)' },
                ]}
                hint="Debug génère beaucoup de logs. Passez à Info ou Warn en production."
              />
              <AdminNumber
                label="Rétention (jours)"
                value={draft.logging.retention}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    logging: { ...draft.logging, retention: v },
                  })
                }
                min={1}
                max={365}
                hint="Les logs plus anciens sont automatiquement supprimés."
              />
            </div>
          </AdminCard>

          {/* Logs récents */}
          <AdminCard
            title="Logs récents"
            description="15 derniers événements (mockés pour la démo)"
          >
            <div className="max-h-96 overflow-y-auto custom-scrollbar rounded-xl border border-white/5">
              <ul className="divide-y divide-white/5 list-none p-0 m-0">
                {MOCK_LOGS.map((log, idx) => {
                  const style = LEVEL_STYLES[log.level];
                  return (
                    <li key={idx} className="flex items-start gap-3 p-3 hover:bg-white/[0.02] transition-colors">
                      <code className="text-[11px] font-mono text-gray-600 mt-0.5 flex-shrink-0 hidden sm:block">
                        {log.ts}
                      </code>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex-shrink-0',
                          style.badge,
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} aria-hidden="true" />
                        {style.label}
                      </span>
                      <span className="text-xs text-gray-300 break-all flex-1">{log.message}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
