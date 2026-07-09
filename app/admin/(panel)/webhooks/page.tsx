// AfriLaunch AI — Admin > Webhooks & API configuration
'use client';

import { useState, useEffect } from 'react';
import { Webhook, Copy, RefreshCw, KeyRound, Gauge } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminTextarea, AdminNumber,
  SaveBar, LoadingState,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';
import { useToast } from '@/components/providers/toast-provider';

function genApiKey(): string {
  return `afl_${Math.random().toString(36).slice(2, 18)}`;
}

export default function AdminWebhooksPage() {
  const { config, loading, saving, save } = useConfig();
  const { toast } = useToast();
  const [draft, setDraft] = useState<typeof config>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [rateLimit, setRateLimit] = useState<number>(60);

  useEffect(() => {
    if (config && !draft) {
      setDraft(config);
      setApiKey((config as any).apiKey || genApiKey());
      setRateLimit((config as any).rateLimit || 60);
    }
  }, [config, draft]);

  if (loading || !draft) return <LoadingState />;

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(config) ||
    rateLimit !== ((config as any).rateLimit || 60);

  const handleSave = async () => {
    await save({
      webhooks: draft.webhooks,
      ...(rateLimit !== ((config as any).rateLimit || 60) ? { rateLimit } : {}),
      ...(apiKey !== ((config as any).apiKey || '') ? { apiKey } : {}),
    } as any);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
    } catch {
      /* clipboard may be unavailable */
    }
    toast({ title: 'Clé copiée', description: 'Clé API copiée dans le presse-papiers.', variant: 'success' });
  };

  const handleRegenerate = () => {
    setApiKey(genApiKey());
    toast({ title: 'Nouvelle clé générée', description: 'L\'ancienne clé ne fonctionnera plus après sauvegarde.', variant: 'warning' });
  };

  const eventsString = draft.webhooks.events.join(', ');

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-pink-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="Webhooks & API"
          description="Webhooks sortants vers votre système et clé d'accès à l'API AfriLaunch."
          icon={Webhook}
          color="from-pink-500 to-rose-600"
        />

        <div className="space-y-6">
          {/* Webhook sortant */}
          <AdminCard
            title="Webhook sortant"
            description="URL appelée par AfriLaunch pour notifier votre système des événements"
          >
            <div className="space-y-4">
              <AdminInput
                label="URL du webhook"
                value={draft.webhooks.inboundUrl}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    webhooks: { ...draft.webhooks, inboundUrl: v },
                  })
                }
                placeholder="https://votre-app.com/webhook"
                hint="Doit répondre 200 OK. Les retries ont lieu 3 fois avec backoff exponentiel."
              />
              <AdminTextarea
                label="Événements à notifier"
                value={eventsString}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    webhooks: {
                      ...draft.webhooks,
                      events: v.split(',').map((s) => s.trim()).filter(Boolean),
                    },
                  })
                }
                rows={3}
                placeholder="payment.success, user.signup, agent.run"
                hint="Séparés par des virgules. Événements disponibles : payment.success, payment.failed, user.signup, user.login, agent.run, agent.complete, social.post, email.sent, webhook.delivered."
              />
            </div>
          </AdminCard>

          {/* Clé API */}
          <AdminCard
            title="Clé API"
            description="Clé d'authentification pour accéder à l'API REST d'AfriLaunch"
            action={<KeyRound className="w-4 h-4 text-pink-400" aria-hidden="true" />}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 rounded-xl glass border border-white/5">
                <code className="flex-1 text-xs font-mono text-gray-300 break-all">{apiKey}</code>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  Copier la clé
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-pink-500 to-rose-600 hover:scale-105 transition-transform shadow-lg"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Régénérer
                </button>
              </div>
              <p className="text-[11px] text-gray-500">
                Incluez cette clé dans l'en-tête <code className="text-gray-400">Authorization: Bearer &lt;clé&gt;</code> de vos requêtes API.
                La régénération invalide immédiatement l'ancienne clé après sauvegarde.
              </p>
            </div>
          </AdminCard>

          {/* Rate limiting */}
          <AdminCard
            title="Rate limiting"
            description="Limite le nombre de requêtes API par minute et par IP"
            action={<Gauge className="w-4 h-4 text-pink-400" aria-hidden="true" />}
          >
            <div className="space-y-3">
              <AdminNumber
                label="Requêtes par minute"
                value={rateLimit}
                onChange={setRateLimit}
                min={1}
                max={10000}
                hint="Au-delà, l'API retourne 429 Too Many Requests."
              />
              <p className="text-[11px] text-gray-500">
                Recommandé : 60 pour les comptes standards, 600 pour les comptes premium, illimité pour les partenaires.
              </p>
            </div>
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
