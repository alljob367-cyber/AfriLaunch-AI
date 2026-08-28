// AfriLaunch AI — Admin > Logs & Monitoring
'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, RefreshCw, Loader2, FileX } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminSelect, AdminNumber,
  SaveBar, LoadingState,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';
import { useToast } from '@/components/providers/toast-provider';
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

export default function AdminLogsPage() {
  const { config, loading, saving, save } = useConfig();
  const { toast } = useToast();
  const [draft, setDraft] = useState<typeof config>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsNote, setLogsNote] = useState<string>('');

  useEffect(() => { if (config && !draft) setDraft(config); }, [config, draft]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/admin/logs?limit=50', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        setLogs(data.logs || []);
        setLogsNote(data.note || '');
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setLogsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

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
            description="50 derniers événements"
            action={
              <button
                type="button"
                onClick={fetchLogs}
                disabled={logsLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold glass border border-white/10 hover:bg-white/10 disabled:opacity-60"
              >
                {logsLoading ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> : <RefreshCw className="w-3 h-3" aria-hidden="true" />}
                Actualiser
              </button>
            }
          >
            {logs.length === 0 ? (
              <div className="text-center py-10">
                <FileX className="w-10 h-10 text-gray-600 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm text-gray-400">Aucun log persistant pour le moment.</p>
                <p className="text-xs text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
                  {logsNote || 'Les logs sont visibles en temps réel dans Vercel → Dashboard → Logs → Functions.'}
                </p>
                <a
                  href="https://vercel.com/afrilaunchia/logs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold glass border border-white/10 hover:bg-white/10"
                >
                  Ouvrir Vercel Logs →
                </a>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto custom-scrollbar rounded-xl border border-white/5">
                <ul className="divide-y divide-white/5 list-none p-0 m-0">
                  {logs.map((log, idx) => {
                    const style = LEVEL_STYLES[log.level] || LEVEL_STYLES.info;
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
            )}
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
