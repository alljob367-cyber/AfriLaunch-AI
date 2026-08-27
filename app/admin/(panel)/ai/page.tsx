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

type ProviderKey = 'openai' | 'anthropic' | 'gemini' | 'zai' | 'mistral' | 'groq' | 'openrouter' | 'custom';

type ProviderMap = AppConfig['ai']['providers'];

const PROVIDER_META: Record<ProviderKey, { label: string; defaultModel: string; gradient: string; description?: string }> = {
  openai: { label: 'OpenAI', defaultModel: 'gpt-4o', gradient: 'from-emerald-500 to-green-600' },
  anthropic: { label: 'Anthropic', defaultModel: 'claude-3-5-sonnet-20241022', gradient: 'from-orange-500 to-amber-600' },
  gemini: { label: 'Google Gemini', defaultModel: 'gemini-1.5-pro', gradient: 'from-blue-500 to-sky-600' },
  zai: { label: 'Z.ai (GLM)', defaultModel: 'glm-4.6', gradient: 'from-violet-500 to-purple-600' },
  mistral: { label: 'Mistral AI', defaultModel: 'mistral-large-latest', gradient: 'from-rose-500 to-orange-600', description: 'LLM français — idéal pour le marché africain francophone' },
  groq: { label: 'Groq', defaultModel: 'llama-3.3-70b-versatile', gradient: 'from-orange-500 to-red-600', description: 'Inférence ultra-rapide (Llama, Mixtral, Gemma) — idéal pour les agents temps réel' },
  openrouter: { label: 'OpenRouter ⭐', defaultModel: 'anthropic/claude-3.5-sonnet', gradient: 'from-purple-500 to-pink-600', description: 'Multi-provider: GPT-4o, Claude 3.5, Gemini, Llama 3.1, Mistral — 1 clé API, 300+ modèles' },
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
            const mistralProvider = key === 'mistral' ? (provider as ProviderMap['mistral']) : null;
            const groqProvider = key === 'groq' ? (provider as ProviderMap['groq']) : null;
            const openrouterProvider = key === 'openrouter' ? (provider as ProviderMap['openrouter']) : null;
            const isConfigured = !!provider.apiKey || (!!customProvider && !!customProvider.baseUrl);
            return (
              <AdminCard
                key={key}
                title={meta.label}
                description={meta.description || (key === 'custom' ? 'Endpoint OpenAI-compatible (vLLM, LM Studio, Ollama, etc.)' : undefined)}
                action={
                  <div className="flex items-center gap-2">
                    <StatusBadge ok={isConfigured && provider.enabled} />
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
                  {key === 'mistral' && mistralProvider && (
                    <AdminInput
                      label="Endpoint API"
                      value={mistralProvider.endpoint}
                      onChange={(v) => updateProvider('mistral', { endpoint: v })}
                      placeholder="https://api.mistral.ai/v1"
                      hint="Endpoint officiel Mistral. Ne changez que si vous utilisez un proxy."
                    />
                  )}
                  {key === 'groq' && groqProvider && (
                    <AdminInput
                      label="Endpoint API"
                      value={groqProvider.endpoint}
                      onChange={(v) => updateProvider('groq', { endpoint: v })}
                      placeholder="https://api.groq.com/openai/v1"
                      hint="Endpoint officiel Groq. Ne changez que si vous utilisez un proxy."
                    />
                  )}
                  {key === 'openrouter' && openrouterProvider && (
                    <>
                      <AdminInput
                        label="Endpoint API"
                        value={openrouterProvider.endpoint}
                        onChange={(v) => updateProvider('openrouter', { endpoint: v })}
                        placeholder="https://openrouter.ai/api/v1"
                        hint="Endpoint officiel OpenRouter. Ne changez que si vous utilisez un proxy."
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <AdminInput
                          label="Nom de l'app"
                          value={openrouterProvider.appName}
                          onChange={(v) => updateProvider('openrouter', { appName: v })}
                          placeholder="AfriLaunch AI"
                          hint="Affiché dans OpenRouter pour le ranking"
                        />
                        <AdminInput
                          label="URL du site"
                          value={openrouterProvider.siteUrl}
                          onChange={(v) => updateProvider('openrouter', { siteUrl: v })}
                          placeholder="https://afrilaunch.ai"
                          hint="HTTP-Referer envoyé à OpenRouter"
                        />
                      </div>
                    </>
                  )}
                  <AdminInput
                    label="Clé API"
                    value={provider.apiKey}
                    onChange={(v) => updateProvider(key, { apiKey: v })}
                    secret
                    placeholder={key === 'custom' ? 'sk-... (optionnel)' : 'sk-...'}
                    hint={key === 'mistral' ? 'Clé API depuis console.mistral.ai → API Keys' : (key === 'groq' ? 'Clé API depuis console.groq.com → API Keys (format: gsk_...)' : (key === 'openrouter' ? 'Clé API depuis openrouter.ai/keys (format: sk-or-...). 1 clé = accès à 300+ modèles.' : (key === 'custom' ? 'Laissez vide si votre endpoint n\'requiert pas d\'authentification' : undefined)))}
                  />
                  <AdminInput
                    label="Modèle"
                    value={provider.model}
                    onChange={(v) => updateProvider(key, { model: v })}
                    placeholder={meta.defaultModel}
                    hint={key === 'mistral' ? 'Modèles disponibles: mistral-large-latest, mistral-medium-latest, mistral-small-latest, open-mistral-7b, open-mixtral-8x7b' : (key === 'groq' ? 'Modèles: llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768, gemma2-9b-it' : (key === 'openrouter' ? 'Modèles: anthropic/claude-3.5-sonnet, openai/gpt-4o, google/gemini-flash-1.5, meta-llama/llama-3.1-405b-instruct, mistralai/mistral-large' : `Modèle par défaut: ${meta.defaultModel}`))}
                  />
                  {key === 'mistral' && (
                    <div className="flex flex-wrap gap-2">
                      {['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'open-mistral-7b', 'open-mixtral-8x7b'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => updateProvider('mistral', { model: m })}
                          className="text-xs px-3 py-1.5 rounded-lg glass hover:bg-white/10 transition-colors"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                  {key === 'groq' && (
                    <div className="flex flex-wrap gap-2">
                      {['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => updateProvider('groq', { model: m })}
                          className="text-xs px-3 py-1.5 rounded-lg glass hover:bg-white/10 transition-colors"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                  {key === 'openrouter' && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-gray-500">Modèles populaires (cliquez pour sélectionner):</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'anthropic/claude-3.5-sonnet',
                          'openai/gpt-4o',
                          'openai/gpt-4o-mini',
                          'google/gemini-flash-1.5',
                          'meta-llama/llama-3.1-405b-instruct',
                          'mistralai/mistral-large',
                          'anthropic/claude-3-opus',
                          'qwen/qwen-2.5-72b-instruct',
                        ].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => updateProvider('openrouter', { model: m })}
                            className="text-xs px-3 py-1.5 rounded-lg glass hover:bg-white/10 transition-colors font-mono"
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-600">💡 Voir tous les 300+ modèles sur openrouter.ai/models</p>
                    </div>
                  )}
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
