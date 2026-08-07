// AfriLaunch AI — Admin > Telegram Bot configuration
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, Check, AlertCircle, Loader2, RefreshCw, ExternalLink, Bot, Zap, Trash2, Link2 } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminToggle, AdminSelect, AdminTextarea,
  SaveBar, LoadingState, StatusBadge, TestButton,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';
import { useToast } from '@/components/providers/toast-provider';
import { AGENTS } from '@/lib/agents';
import { cn } from '@/lib/utils';

interface BotStatus {
  ok: boolean;
  configured: boolean;
  enabled: boolean;
  hasToken: boolean;
  bot?: { id: number; username: string; first_name: string; can_join_groups: boolean };
  webhook?: { url: string; has_custom_certificate: boolean; pending_update_count: number; last_error_date?: number; last_error_message?: string };
  defaultAgent?: string;
  webhookSecret?: string;
  webhookUrl?: string;
  error?: string;
}

export default function AdminTelegramPage() {
  const { config, loading, saving, save, reload } = useConfig();
  const { toast } = useToast();
  const [draft, setDraft] = useState<typeof config>(null);
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [settingWebhook, setSettingWebhook] = useState(false);

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/telegram/status', { credentials: 'include' });
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setStatus({ ok: false, configured: false, enabled: false, hasToken: false, error: (err as Error).message });
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => { if (config && !draft) setDraft(config); }, [config, draft]);
  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  if (loading || !draft || !config) return <LoadingState />;

  const dirty = JSON.stringify(draft.telegram) !== JSON.stringify(config.telegram);
  const update = (patch: Partial<typeof draft.telegram>) =>
    setDraft({ ...draft, telegram: { ...draft.telegram, ...patch } });

  const handleSave = async () => {
    const ok = await save({ telegram: draft.telegram });
    if (ok) {
      setTimeout(() => fetchStatus(), 500);
    }
  };

  const handleSetWebhook = async () => {
    setSettingWebhook(true);
    try {
      const res = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ webhookUrl: draft.appUrl }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: 'Webhook configuré ✓', description: `Bot accessible via ${data.webhookUrl}`, variant: 'success' });
        fetchStatus();
      } else {
        toast({ title: 'Échec webhook', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' });
    } finally {
      setSettingWebhook(false);
    }
  };

  const handleDeleteWebhook = async () => {
    try {
      const res = await fetch('/api/telegram/setup', { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      toast({
        title: data.ok ? 'Webhook supprimé' : 'Échec',
        description: data.message || data.error,
        variant: data.ok ? 'warning' : 'error',
      });
      if (data.ok) fetchStatus();
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' });
    }
  };

  const botUsername = status?.bot?.username;
  const webhookActive = status?.webhook?.url && !status.webhook.url.includes('127.0.0.1');
  const hasErrors = status?.webhook?.last_error_message;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-blue-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="Telegram Bot"
          description="Connectez vos 13 agents IA à Telegram. Les utilisateurs pourvent discuter avec chaque agent via /commandes."
          icon={Send}
          color="from-sky-500 to-blue-600"
        />

        <div className="space-y-6">
          {/* Status overview */}
          <AdminCard title="Statut du bot" description="Informations en temps réel depuis l'API Telegram">
            <div className="flex items-center gap-3 flex-wrap">
              {statusLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-sky-400" aria-hidden="true" />
              ) : botUsername ? (
                <>
                  <StatusBadge ok={true} label={`@${botUsername}`} />
                  <StatusBadge ok={!!webhookActive} label={webhookActive ? 'Webhook actif' : 'Webhook inactif'} />
                  {draft.telegram.enabled ? (
                    <StatusBadge ok={true} label="Bot activé" />
                  ) : (
                    <StatusBadge ok={false} label="Bot désactivé" />
                  )}
                  {status?.webhook?.pending_update_count !== undefined && status.webhook.pending_update_count > 0 && (
                    <StatusBadge ok={false} label={`${status.webhook.pending_update_count} updates en attente`} />
                  )}
                </>
              ) : (
                <StatusBadge ok={false} label="Non configuré" />
              )}
              <button
                type="button"
                onClick={fetchStatus}
                disabled={statusLoading}
                className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg glass hover:bg-white/10 text-xs font-semibold"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', statusLoading && 'animate-spin')} aria-hidden="true" />
                Actualiser
              </button>
            </div>

            {botUsername && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs text-gray-500">Bot ID</p><p className="font-mono">{status?.bot?.id}</p></div>
                <div><p className="text-xs text-gray-500">Nom</p><p>{status?.bot?.first_name}</p></div>
                <div><p className="text-xs text-gray-500">Updates en attente</p><p className="font-mono">{status?.webhook?.pending_update_count ?? 0}</p></div>
                <div><p className="text-xs text-gray-500">Dernière erreur</p><p className="text-xs">{hasErrors ? new Date((status?.webhook?.last_error_date ?? 0) * 1000).toLocaleString('fr-FR') : 'Aucune'}</p></div>
              </div>
            )}

            {hasErrors && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                <strong>Dernière erreur webhook:</strong> {status?.webhook?.last_error_message}
              </div>
            )}
          </AdminCard>

          {/* Bot configuration */}
          <AdminCard title="Configuration du bot" description="Token obtenu via @BotFather sur Telegram">
            <div className="space-y-4">
              <AdminToggle
                label="Activer le bot"
                description="Active la réception et le traitement des messages Telegram"
                checked={draft.telegram.enabled}
                onChange={(v) => update({ enabled: v })}
              />
              <AdminInput
                label="Bot Token"
                value={draft.telegram.botToken}
                onChange={(v) => update({ botToken: v })}
                secret
                placeholder="123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                hint="Créez un bot avec @BotFather sur Telegram, copiez le token ici."
              />
              <AdminSelect
                label="Agent par défaut"
                value={draft.telegram.defaultAgent}
                onChange={(v) => update({ defaultAgent: v })}
                options={AGENTS.map((a) => ({ value: a.id, label: `${a.name} — ${a.role}` }))}
                hint="Agent utilisé quand l'utilisateur envoie un message sans /commande (routage automatique par mots-clés)"
              />
              <AdminTextarea
                label="Message de bienvenue"
                value={draft.telegram.welcomeMessage}
                onChange={(v) => update({ welcomeMessage: v })}
                rows={6}
                hint="Affiché quand un utilisateur tape /start ou /help"
              />
            </div>
          </AdminCard>

          {/* Webhook management */}
          <AdminCard title="Webhook" description="URL que Telegram appellera pour chaque message reçu">
            <div className="space-y-4">
              {status?.webhookUrl && (
                <div className="p-3 rounded-lg glass border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">URL du webhook</p>
                  <p className="text-xs font-mono break-all">{status.webhookUrl}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSetWebhook}
                  disabled={settingWebhook || !draft.telegram.botToken}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-blue-600 hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {settingWebhook ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}
                  {settingWebhook ? 'Configuration...' : 'Activer le webhook'}
                </button>
                <TestButton
                  onTest={async () => {
                    const r = await fetch('/api/telegram/status', { credentials: 'include' });
                    const d = await r.json();
                    return { ok: d.configured && !!d.bot, message: d.bot ? `Bot @${d.bot.username} accessible` : (d.error || 'Bot non accessible') };
                  }}
                  label="Tester la connexion"
                />
                <button
                  type="button"
                  onClick={handleDeleteWebhook}
                  disabled={!draft.telegram.botToken}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  Supprimer
                </button>
              </div>

              <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/30 text-xs text-sky-300">
                <p className="font-bold mb-1">📋 Étapes de configuration :</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Ouvrez Telegram, cherchez <strong>@BotFather</strong></li>
                  <li>Envoyez <code className="bg-black/30 px-1 rounded">/newbot</code> et suivez les instructions</li>
                  <li>Copiez le token et collez-le ci-dessus</li>
                  <li>Activez le bot (toggle) et cliquez "Enregistrer"</li>
                  <li>Cliquez "Activer le webhook"</li>
                  <li>Ouvrez votre bot sur Telegram et envoyez <code className="bg-black/30 px-1 rounded">/start</code></li>
                </ol>
              </div>
            </div>
          </AdminCard>

          {/* Agents available on Telegram */}
          <AdminCard title={`Agents disponibles (${AGENTS.length})`} description="Chaque agent est accessible via /<commande> sur Telegram">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AGENTS.map((agent) => (
                <div key={agent.id} className="flex items-center gap-3 p-3 rounded-xl glass border border-white/5">
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', agent.color)}>
                    <Bot className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{agent.name}</p>
                    <p className="text-xs text-gray-500 truncate">{agent.role}</p>
                  </div>
                  <code className="text-xs px-2 py-1 rounded-lg bg-black/30 text-sky-300 font-mono whitespace-nowrap">
                    /{agent.command}
                  </code>
                </div>
              ))}
            </div>
          </AdminCard>

          {/* Security */}
          <AdminCard title="Sécurité" description="Restreindre l'accès au bot à certains utilisateurs">
            <AdminTextarea
              label="User IDs autorisés (un par ligne, vide = tous)"
              value={draft.telegram.allowedUserIds.join('\n')}
              onChange={(v) => update({
                allowedUserIds: v.split('\n').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0),
              })}
              rows={3}
              placeholder="123456789\n987654321"
              hint="Pour trouver votre User ID, parlez à @userinfobot sur Telegram. Laissez vide pour autoriser tout le monde."
            />
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
