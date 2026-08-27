// AfriLaunch AI — AI runner: calls the configured LLM provider
// Supports Mistral, Groq, OpenRouter (OpenAI-compatible), and others via their APIs
// Includes per-plan model routing for cost optimization

import { getConfig, type AppConfig } from './config-store';
import type { PlanId } from './user-types';

export interface RunOptions {
  systemPrompt: string;
  userMessage: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
}

export interface RunResult {
  ok: boolean;
  reply?: string;
  error?: string;
  provider?: string;
  model?: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// Plan-based model routing on OpenRouter (cost optimization)
const PLAN_MODELS: Record<PlanId, string> = {
  starter: 'openai/gpt-4o-mini',            // ~0.0005$/msg — économique
  pro: 'anthropic/claude-3.5-sonnet',       // ~0.012$/msg — qualité pro
  business: 'anthropic/claude-3.5-sonnet',  // ~0.012$/msg — qualité pro
  enterprise: 'openai/gpt-4o',              // ~0.009$/msg — polyvalent
};

// Backward-compatible: runAI without plan uses the configured primary provider
export async function runAI(opts: RunOptions): Promise<RunResult> {
  const config = await getConfig();

  if (!config.ai.providers[config.ai.primary]?.enabled) {
    // Try fallback: find any enabled provider with an API key
    const fallback = findEnabledProvider(config);
    if (!fallback) {
      return { ok: false, error: 'Aucun provider IA activé. Configurez-en un dans /admin/ai' };
    }
    return callProvider(fallback.provider, fallback.providerConfig, opts, config);
  }

  const provider = config.ai.primary;
  const providerConfig = config.ai.providers[provider];
  if (!providerConfig.apiKey) {
    return { ok: false, error: `Provider ${provider} activé mais clé API manquante. Configurez-la dans /admin/ai` };
  }

  return callProvider(provider, providerConfig, opts, config);
}

// Plan-aware runner: routes to the best model based on the user's plan
// Uses OpenRouter if available (so we can switch models per plan), else falls back to the primary provider
export async function runAIForPlan(opts: RunOptions, plan: PlanId): Promise<RunResult> {
  const config = await getConfig();

  // If OpenRouter is enabled and has a key, use plan-based model routing
  const openrouter = config.ai.providers.openrouter;
  if (openrouter?.enabled && openrouter.apiKey) {
    const targetModel = PLAN_MODELS[plan] || PLAN_MODELS.starter;
    const providerConfig = { ...openrouter, model: targetModel };
    return callProvider('openrouter', providerConfig, opts, config);
  }

  // Fallback to the configured primary provider
  return runAI(opts);
}

function findEnabledProvider(config: AppConfig): { provider: string; providerConfig: any } | null {
  for (const [name, p] of Object.entries(config.ai.providers)) {
    if ((p as any).enabled && (p as any).apiKey) {
      return { provider: name, providerConfig: p };
    }
  }
  return null;
}

async function callProvider(
  provider: string,
  providerConfig: any,
  opts: RunOptions,
  config: AppConfig,
): Promise<RunResult> {
  const maxTokens = opts.maxTokens ?? config.ai.maxTokensPerRequest ?? 4096;

  // Mistral and Groq both use OpenAI-compatible /chat/completions endpoint
  if (provider === 'mistral' || provider === 'groq') {
    const endpoint = providerConfig.endpoint || (provider === 'mistral' ? 'https://api.mistral.ai/v1' : 'https://api.groq.com/openai/v1');
    const model = providerConfig.model || (provider === 'mistral' ? 'mistral-large-latest' : 'llama-3.3-70b-versatile');

    const messages = [
      { role: 'system', content: opts.systemPrompt },
      ...(opts.history ?? []),
      { role: 'user', content: opts.userMessage },
    ];

    try {
      const res = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(180000), // 3 minutes — Mistral can be slow from Asia servers
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        let errMsg = `HTTP ${res.status}`;
        try {
          const errJson = JSON.parse(errBody);
          errMsg = errJson.message || errJson.error?.message || errMsg;
        } catch { /* not JSON */ }
        return { ok: false, error: `${provider} erreur: ${errMsg}`, provider, model };
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) return { ok: false, error: 'Réponse vide du provider', provider, model };

      return {
        ok: true,
        reply,
        provider,
        model: data.model || model,
        usage: data.usage,
      };
    } catch (err) {
      return { ok: false, error: `${provider} erreur réseau: ${(err as Error).message}`, provider, model: providerConfig.model };
    }
  }

  // OpenRouter — multi-provider gateway (access GPT-4, Claude, Gemini, Llama, etc. via one API)
  if (provider === 'openrouter') {
    const endpoint = providerConfig.endpoint || 'https://openrouter.ai/api/v1';
    const model = providerConfig.model || 'anthropic/claude-3.5-sonnet';
    const appName = providerConfig.appName || 'AfriLaunch AI';
    const siteUrl = providerConfig.siteUrl || 'https://afrilaunch.ai';

    const messages = [
      { role: 'system', content: opts.systemPrompt },
      ...(opts.history ?? []),
      { role: 'user', content: opts.userMessage },
    ];

    try {
      const res = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerConfig.apiKey}`,
          'Content-Type': 'application/json',
          // OpenRouter recommends these headers for attribution/ranking
          'HTTP-Referer': siteUrl,
          'X-Title': appName,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(180000),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        let errMsg = `HTTP ${res.status}`;
        try {
          const errJson = JSON.parse(errBody);
          errMsg = errJson.message || errJson.error?.message || errMsg;
        } catch { /* not JSON */ }
        if (res.status === 401) return { ok: false, error: `OpenRouter: clé API invalide (401). ${errMsg}`, provider, model };
        if (res.status === 402) return { ok: false, error: `OpenRouter: crédits insuffisants (402). ${errMsg}`, provider, model };
        if (res.status === 429) return { ok: false, error: `OpenRouter: rate limit atteint (429). ${errMsg}`, provider, model };
        return { ok: false, error: `OpenRouter erreur: ${errMsg}`, provider, model };
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) return { ok: false, error: 'Réponse vide d\'OpenRouter', provider, model };

      return {
        ok: true,
        reply,
        provider,
        model: data.model || model,
        usage: data.usage,
      };
    } catch (err) {
      return { ok: false, error: `OpenRouter erreur réseau: ${(err as Error).message}`, provider, model: providerConfig.model };
    }
  }

  // For other providers (OpenAI, Anthropic, Gemini, Z.ai, custom) — simulated
  // Real implementation would use their respective SDKs
  return {
    ok: false,
    error: `Provider ${provider} non implémenté dans le runner. Configurez Mistral ou Groq dans /admin/ai`,
    provider,
  };
}
