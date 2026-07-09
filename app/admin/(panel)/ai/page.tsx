// AfriLaunch AI — Admin > AI & LLM providers configuration
'use client';

import { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminSelect, AdminToggle, AdminNumber,
  SaveBar, LoadingState, TestButton, StatusBadge,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';
import type { AppConfig } from '@/lib/config-store';

type ProviderKey = 'openai' | 'anthropic' | 'gemini' | 'zai' | 'custom';

type ProviderMap = AppConfig['ai']['providers'];

const PROVIDER_META: Record<ProviderKey, { label: string; defaultModel: string; gradient: string }> = {
  openai: { label: 'OpenAI', defaultModel: 'gpt-4o', gradient: 'from-emerald-500 to-green-600' },
  anthropic: { label: 'Anthropic', defaultModel: 'claude-3-5-sonnet-20241022', gradient: 'from-orange-500 to-amber-600' },
  gemini: { label: 'Google Gemini', defaultModel: 'gemini-1.5-pro', gradient: 'from-blue-500 to-sky-600' },
  zai: { label: 'Z.ai (GLM)', defaultModel: 'glm-4.6', gradient: 'from-violet-500 to-purple-600' },
  custom: { label: 'Custom (OpenAI-compatible)', defaultModel: 'your-model', gradient: 'from-gray-500 to-slate-600' },
};

export default function AdminAiPage() {
  const { config, loading, saving, save, test } = useConfig();
  const [draft, setDraft] = useState<typeof config>(null);

  useEffect(() => { if (config && !draft) setDraft(config); }, [config, draft]);

  if (loading || !draft) return <LoadingState />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);

  const handleSave = async () => {
    await save({ ai: draft.ai });
  };

  const updateProvider = <K extends ProviderKey>(key: K, patch: Partial<ProviderMap[K]>) => {
    const nextProviders = { ...draft.ai.providers };
    (nextProviders as Record<ProviderKey, ProviderMap[ProviderKey]>)[key] = {
      ...nextProviders[key],
      ...patch,
    } as ProviderMap[K];
    setDraft({
      ...draft,
      ai: {
        ...draft.ai,
        providers: nextProviders,
      },
    });
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="IA & LLM"
          description="Configurez les providers LLM qui alimentent vos 13 agents IA. Un provider primaire + fallback optionnel."
          icon={Bot}
          color="from-violet-500 to-purple-600"
        />

        <div className="space-y-6">
          {/* Provider primaire */}
          <AdminCard
            title="Provider primaire"
            description="Provider utilisé par défaut pour toutes les requêtes LLM"
            action={<StatusBadge ok={draft.ai.providers[draft.ai.primary]?.enabled && !!draft.ai.providers[draft.ai.primary]?.apiKey} />}
          >
            <div className="space-y-4">
              <AdminSelect
                label="Provider par défaut"
                value={draft.ai.primary}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    ai: { ...draft.ai, primary: v as typeof draft.ai.primary },
                  })
                }
                options={Object.entries(PROVIDER_META).map(([k, v]) => ({ value: k, label: v.label }))}
                hint="Le provider primaire doit être activé et avoir une clé API valide ci-dessous."
              />
              <AdminToggle
                label="Fallback automatique"
                description="Si le provider primaire échoue, bascule automatiquement sur un autre provider actif"
                checked={draft.ai.fallback}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    ai: { ...draft.ai, fallback: v },
                  })
                }
              />
              <AdminNumber
                label="Tokens max par requête"
                value={draft.ai.maxTokensPerRequest}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    ai: { ...draft.ai, maxTokensPerRequest: v },
                  })
                }
                min={256}
                max={32768}
                step={256}
                hint="Limite haute de tokens générés par requête. Affecte le coût et la latence."
              />
            </div>
          </AdminCard>

          {/* Providers */}
          {(Object.keys(PROVIDER_META) as ProviderKey[]).map((key) => {
            const meta = PROVIDER_META[key];
            const provider = draft.ai.providers[key];
            const customProvider = key === 'custom' ? (provider as ProviderMap['custom']) : null;
            const isConfigured = !!provider.apiKey || (!!customProvider && !!customProvider.baseUrl);
            return (
              <AdminCard
                key={key}
                title={meta.label}
                description={key === 'custom' ? 'Endpoint OpenAI-compatible (vLLM, LM Studio, Ollama, etc.)' : undefined}
                action={
                  <div className="flex items-center gap-2">
                    <StatusBadge ok={isConfigured} />
                  </div>
                }
              >
                <div className="space-y-4">
                  <AdminToggle
                    label="Activer ce provider"
                    description="Inclus ce provider dans la rotation si fallback activé"
                    checked={provider.enabled}
                    onChange={(v) => updateProvider(key, { enabled: v })}
                  />
                  {key === 'custom' && customProvider && (
                    <AdminInput
                      label="URL de base"
                      value={customProvider.baseUrl}
                      onChange={(v) => updateProvider('custom', { baseUrl: v })}
                      placeholder="https://api.votre-endpoint.com/v1"
                      hint="Endpoint OpenAI-compatible. Ex: http://localhost:11434/v1 pour Ollama."
                    />
                  )}
                  <AdminInput
                    label="Clé API"
                    value={provider.apiKey}
                    onChange={(v) => updateProvider(key, { apiKey: v })}
                    secret
                    placeholder={key === 'custom' ? 'sk-... (optionnel)' : 'sk-...'}
                    hint={key === 'custom' ? 'Laissez vide si votre endpoint n\'requiert pas d\'authentification' : undefined}
                  />
                  <AdminInput
                    label="Modèle"
                    value={provider.model}
                    onChange={(v) => updateProvider(key, { model: v })}
                    placeholder={meta.defaultModel}
                    hint={`Modèle par défaut: ${meta.defaultModel}`}
                  />
                  <TestButton onTest={() => test('ai', key)} label={`Tester ${meta.label}`} />
                </div>
              </AdminCard>
            );
          })}

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
