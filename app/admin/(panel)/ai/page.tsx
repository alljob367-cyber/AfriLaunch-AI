// AfriLaunch AI — Admin > AI & LLM providers configuration
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bot, Activity, RefreshCw, Zap, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminSelect, AdminToggle, AdminNumber,
  SaveBar, LoadingState, TestButton, StatusBadge,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';
import type { AppConfig } from '@/lib/config-store';
import { cn } from '@/lib/utils';

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
    await save({ ai: draft.ai, elevenlabs: draft.elevenlabs });
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

  const updateElevenlabs = (patch: Partial<typeof draft.elevenlabs>) => {
    setDraft({ ...draft, elevenlabs: { ...draft.elevenlabs, ...patch } });
  };

  const testElevenlabs = async (): Promise<{ ok: boolean; message: string }> => {
    try {
      const res = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: 'Connexion AfriLaunch AI OK' }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.audioUrl) {
        return { ok: true, message: `Audio généré ✓ — modèle: ${data.model}, voix: ${data.voiceId}` };
      }
      return { ok: false, message: data.error || `Erreur (${res.status})` };
    } catch (err) {
      return { ok: false, message: (err as Error).message };
    }
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

          {/* ElevenLabs — Voice AI */}
          <AdminCard
            title="ElevenLabs — Voix IA"
            description="Génération vocale pour WhatsApp et Telegram (messages vocaux)"
            action={<StatusBadge ok={draft.elevenlabs.enabled && !!draft.elevenlabs.apiKey} />}
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer ElevenLabs"
                description="Permet la génération de messages vocaux (TTS) pour les agents et la page Voix IA"
                checked={draft.elevenlabs.enabled}
                onChange={(v) => updateElevenlabs({ enabled: v })}
              />
              <AdminInput
                label="Clé API"
                value={draft.elevenlabs.apiKey}
                onChange={(v) => updateElevenlabs({ apiKey: v })}
                secret
                placeholder="sk_..."
                hint="Clé API depuis elevenlabs.io → Profile → API Keys"
              />
              <AdminInput
                label="Voice ID"
                value={draft.elevenlabs.voiceId}
                onChange={(v) => updateElevenlabs({ voiceId: v })}
                placeholder="21m00Tcm4TlvDq8ikWAM"
                hint="Voice ID depuis elevenlabs.io → Voices. Défaut: 21m00Tcm4TlvDq8ikWAM (Rachel)"
              />
              <AdminSelect
                label="Modèle"
                value={draft.elevenlabs.model}
                onChange={(v) => updateElevenlabs({ model: v })}
                options={[
                  { value: 'eleven_multilingual_v2', label: 'eleven_multilingual_v2' },
                  { value: 'eleven_turbo_v2_5', label: 'eleven_turbo_v2_5' },
                  { value: 'eleven_monolingual_v1', label: 'eleven_monolingual_v1' },
                ]}
                hint="Multilingual recommandé pour le français et les langues africaines"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AdminNumber
                  label="Stability"
                  value={draft.elevenlabs.stability}
                  onChange={(v) => updateElevenlabs({ stability: v })}
                  min={0}
                  max={1}
                  step={0.05}
                  hint="0 = créatif, 1 = stable"
                />
                <AdminNumber
                  label="Similarity boost"
                  value={draft.elevenlabs.similarityBoost}
                  onChange={(v) => updateElevenlabs({ similarityBoost: v })}
                  min={0}
                  max={1}
                  step={0.05}
                  hint="Fidélité à la voix d'origine"
                />
              </div>
              <TestButton onTest={testElevenlabs} label="Tester ElevenLabs" />
            </div>
          </AdminCard>

          <AdminCard title="Santé des providers (load balancer)">
            <ProviderHealthPanel />
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}

// ─── Provider Health Panel ────────────────────────────────────────────
function ProviderHealthPanel() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-health', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setHealth(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHealth();
    // Poll every 10s
    const id = setInterval(fetchHealth, 10000);
    return () => clearInterval(id);
  }, [fetchHealth]);

  async function handleReset() {
    setResetting(true);
    try {
      await fetch('/api/admin/ai-health', {
        method: 'POST',
        credentials: 'include',
      });
      await fetchHealth();
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return <div className="text-xs text-gray-500">Chargement de la santé des providers…</div>;
  }

  if (!health) {
    return <div className="text-xs text-red-400">Impossible de charger la santé des providers.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Capacity summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-yellow-500" aria-hidden="true" />
            <span className="text-xs font-semibold text-gray-400">Capacité estimée</span>
          </div>
          <p className="text-lg font-bold gradient-text">
            {health.capacity?.estimatedDailyRequests?.toLocaleString('fr-FR') ?? 0}
          </p>
          <p className="text-[10px] text-gray-500">requêtes/jour (free tiers cumulés)</p>
        </div>
        <div className="glass rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-gray-400">Utilisateurs Starter</span>
          </div>
          <p className="text-lg font-bold gradient-text">
            ~{health.capacity?.estimatedStarterUsers ?? 0}
          </p>
          <p className="text-[10px] text-gray-500">utilisateurs actifs/jour supportés</p>
        </div>
        <div className="glass rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-gray-400">Providers actifs</span>
          </div>
          <p className="text-lg font-bold gradient-text">
            {health.summary?.active ?? 0}/{health.summary?.total ?? 0}
          </p>
          <p className="text-[10px] text-gray-500">
            {health.summary?.cooldown > 0 ? `${health.summary.cooldown} en cooldown` : 'Tous opérationnels'}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 italic">
        💡 {health.capacity?.note}
      </p>

      {/* Per-provider health */}
      <div className="space-y-2">
        {health.providers?.map((p: any) => (
          <div
            key={p.name}
            className={cn(
              'flex items-center justify-between p-3 rounded-xl border',
              p.inCooldown
                ? 'bg-red-500/5 border-red-500/30'
                : p.enabled && p.apiKey
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-gray-500/5 border-gray-500/20',
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                p.inCooldown ? 'bg-red-500/20' : p.enabled && p.apiKey ? 'bg-emerald-500/20' : 'bg-gray-500/20',
              )}>
                {p.inCooldown ? (
                  <AlertCircle className="w-4 h-4 text-red-400" aria-hidden="true" />
                ) : p.enabled && p.apiKey ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-500" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold capitalize">{p.name}</p>
                <p className="text-[10px] text-gray-500">
                  {p.enabled && p.apiKey
                    ? p.inCooldown
                      ? `En cooldown · ${p.cooldownSecondsLeft}s restantes · dernière erreur: ${p.lastErrorKind || 'inconnue'}`
                      : `OK · ${p.totalSuccesses} succès / ${p.totalErrors} erreurs · ${p.successRate}% succès`
                    : 'Non configuré'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-right">
              <div className="text-[10px] text-gray-500">
                <p>priorité {p.priority}</p>
                {p.consecutiveErrors > 0 && (
                  <p className="text-red-400">{p.consecutiveErrors} erreurs consécutives</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reset button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold glass border border-white/10 hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3 h-3', resetting && 'animate-spin')} aria-hidden="true" />
          {resetting ? 'Reset…' : 'Reset health'}
        </button>
      </div>
    </div>
  );
}
