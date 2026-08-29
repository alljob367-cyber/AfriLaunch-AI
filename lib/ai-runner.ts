// AfriLaunch AI — AI runner: calls the configured LLM provider
// Supports Mistral, Groq, OpenRouter (OpenAI-compatible), and others via their APIs
// Includes per-plan model routing for cost optimization + multi-provider load balancing

import { getConfig, type AppConfig } from './config-store';
import type { PlanId } from './user-types';
import {
  syncHealthFromConfig, pickProviderChain, markError, markSuccess,
  classifyError, resetHealth, getHealthSnapshot,
  type ProviderName,
} from './ai-load-balancer';

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

// Re-export load balancer utilities for admin API
export { resetHealth, getHealthSnapshot, type ProviderName };

// Plan-based model routing on OpenRouter (cost optimization + speed)
// Fast, free models — chosen for ≤2s response time on short prompts.
//   - chat (≤800 tokens):  llama 3.1 8b (fast, free, multilingual)
//   - long-form (≤3000):   minimax m3 free (good quality/price ratio)
//   - website (≤6000):     minimax m3 free (needs longer context)
const PLAN_MODELS_FAST: Record<PlanId, string> = {
  starter: 'meta-llama/llama-3.1-8b-instruct:free',
  pro: 'meta-llama/llama-3.1-8b-instruct:free',
  business: 'meta-llama/llama-3.1-8b-instruct:free',
  enterprise: 'meta-llama/llama-3.1-8b-instruct:free',
};

const PLAN_MODELS_QUALITY: Record<PlanId, string> = {
  starter: 'minimax/minimax-m3:free',
  pro: 'minimax/minimax-m3:free',
  business: 'minimax/minimax-m3:free',
  enterprise: 'minimax/minimax-m3:free',
};

// Per-provider fast chat models (used by runAIForPlanFastStream + load balancer).
// All free-tier — chosen for speed + multilingual support.
// NOTE (2025-08): OpenRouter retired `meta-llama/llama-3.1-8b-instruct:free`.
// The only reliably-working free model on OpenRouter right now is
// `minimax/minimax-m3:free` (tested OK with streaming). We use it for both
// fast chat and quality long-form on OpenRouter — Groq provides the speed.
const FAST_MODELS_PER_PROVIDER: Record<ProviderName, string> = {
  openrouter: 'minimax/minimax-m3:free',     // tested OK with streaming
  cerebras: 'llama3.1-8b',           // Cerebras ultra-fast (1000+ tok/s)
  mistral: 'mistral-small-latest',            // free tier, decent speed
};

// Per-provider quality models (used by long-form generation: identity/website)
const QUALITY_MODELS_PER_PROVIDER: Record<ProviderName, string> = {
  openrouter: 'minimax/minimax-m3:free',     // same — only free model that works
  cerebras: 'llama-3.3-70b',                 // Cerebras 70B for quality
  mistral: 'mistral-large-latest',            // better quality
};

// Backward-compatible alias (used by long-form generation paths).
const PLAN_MODELS = PLAN_MODELS_QUALITY;

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

// Fast variant: uses smaller, faster models for short chat replies (≤800 tokens).
// Use this for interactive agent chat where latency matters more than depth.
export async function runAIForPlanFast(opts: RunOptions, plan: PlanId): Promise<RunResult> {
  const config = await getConfig();
  const openrouter = config.ai.providers.openrouter;
  if (openrouter?.enabled && openrouter.apiKey) {
    const targetModel = PLAN_MODELS_FAST[plan] || PLAN_MODELS_FAST.starter;
    const providerConfig = { ...openrouter, model: targetModel };
    return callProvider('openrouter', providerConfig, opts, config);
  }
  return runAIForPlan(opts, plan);
}

// Streaming variant — yields chunks as they arrive from the LLM.
// Uses the load balancer to try multiple providers in priority order, with
// automatic fallback on rate-limit (429), auth (401/403) and server (5xx)
// errors. Falls back to non-streaming run if no provider supports SSE.
export interface StreamEvent {
  chunk?: string;
  error?: string;
  done?: boolean;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// Build the OpenAI-compatible request body for a given provider
function buildChatBody(model: string, opts: RunOptions, maxTokens: number, stream: boolean) {
  return JSON.stringify({
    model,
    messages: [
      { role: 'system', content: opts.systemPrompt },
      ...(opts.history ?? []),
      { role: 'user', content: opts.userMessage },
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
    stream,
  });
}

// Build the request headers for a given provider
function buildHeaders(provider: ProviderName, providerConfig: any): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${providerConfig.apiKey}`,
    'Content-Type': 'application/json',
  };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = providerConfig.siteUrl || 'https://afrilaunch.ai';
    headers['X-Title'] = providerConfig.appName || 'AfriLaunch AI';
  }
  return headers;
}

// Resolve endpoint URL for a provider (with config override)
function getEndpoint(provider: ProviderName, providerConfig: any): string {
  if (provider === 'openrouter') {
    return (providerConfig.endpoint || 'https://openrouter.ai/api/v1') + '/chat/completions';
  }
  if (provider === 'cerebras') {
    return (providerConfig.endpoint || 'https://api.cerebras.ai/v1') + '/chat/completions';
  }
  if (provider === 'mistral') {
    return (providerConfig.endpoint || 'https://api.mistral.ai/v1') + '/chat/completions';
  }
  return '';
}

export async function* runAIForPlanFastStream(opts: RunOptions, plan: PlanId): AsyncGenerator<StreamEvent> {
  const config = await getConfig();
  syncHealthFromConfig(config);
  const maxTokens = opts.maxTokens ?? 800;
  const timeoutMs = maxTokens <= 1000 ? 45000 : 180000;

  // Get the ordered list of providers to try (load balancer)
  const chain = pickProviderChain(3);

  // Fallback path: no provider configured at all → synchronous call (will fail
  // gracefully with the legacy "no provider" error message)
  if (chain.length === 0) {
    const result = await runAIForPlanFast(opts, plan);
    if (result.ok && result.reply) {
      yield { chunk: result.reply };
      yield { done: true, usage: result.usage };
    } else {
      yield { error: result.error || 'Aucun provider IA configuré. Activez OpenRouter, Mistral ou Groq dans /admin/ai' };
    }
    return;
  }

  // Try each provider in the chain
  let lastError: string | null = null;
  for (const provider of chain) {
    const providerConfig = (config.ai.providers as any)[provider];
    if (!providerConfig?.apiKey) continue;

    const model = FAST_MODELS_PER_PROVIDER[provider];
    const endpoint = getEndpoint(provider, providerConfig);
    const headers = buildHeaders(provider, providerConfig);

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: buildChatBody(model, opts, maxTokens, true),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      // Network error → mark provider, try next
      markError(provider, 'network');
      lastError = `${provider} réseau: ${(err as Error).message}`;
      continue;
    }

    if (!res.ok || !res.body) {
      const kind = classifyError(res.status);
      const errText = await res.text().catch(() => '');
      let errMsg = `HTTP ${res.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.message || errJson.error?.message || errMsg;
      } catch { /* not JSON */ }

      markError(provider, kind);
      lastError = `${provider}: ${errMsg}`;

      // 401/403 (auth) → key is broken, don't try this provider for a while
      // 429 (rate limit) → try the next provider immediately
      // 5xx (server) → try the next provider
      if (kind === 'auth' || kind === 'rate-limit' || kind === 'server') {
        continue;
      }
      // Other errors (400, 404) → also try next provider
      continue;
    }

    // Stream is OK — consume it
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let gotAnyChunk = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const dataLines = evt.split('\n').filter((l) => l.startsWith('data:'));
          for (const line of dataLines) {
            const data = line.slice(5).trim();
            if (!data || data === '[DONE]') {
              markSuccess(provider);
              yield { done: true };
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.choices?.[0]?.delta?.content;
              if (typeof chunk === 'string' && chunk.length > 0) {
                gotAnyChunk = true;
                yield { chunk };
              }
              if (parsed.usage) {
                yield { usage: parsed.usage };
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      }
      // Stream ended cleanly
      if (gotAnyChunk) {
        markSuccess(provider);
        yield { done: true };
        return;
      }
      // Got 200 + empty stream → mark error and try next provider
      markError(provider, 'server');
      lastError = `${provider}: flux vide`;
      continue;
    } catch (err) {
      markError(provider, 'network');
      lastError = `${provider} stream: ${(err as Error).message}`;
      continue;
    }
  }

  // All providers failed
  yield { error: lastError || 'Tous les providers IA ont échoué. Réessayez dans 1 minute.' };
}

// Long-form streaming variant — for website/identity generation (richer content).
// Same load-balanced fallback logic as runAIForPlanFastStream, but uses the
// QUALITY model per provider (minimax-m3:free on OR, llama-3.3-70b on Groq,
// mistral-large on Mistral) and supports larger max_tokens budgets.
export async function* runAIForPlanStream(opts: RunOptions, plan: PlanId): AsyncGenerator<StreamEvent> {
  const config = await getConfig();
  syncHealthFromConfig(config);
  const maxTokens = opts.maxTokens ?? 4000;
  const timeoutMs = maxTokens <= 1000 ? 45000 : 240000; // 4 min for long-form

  const chain = pickProviderChain(3);

  if (chain.length === 0) {
    const result = await runAIForPlan(opts, plan);
    if (result.ok && result.reply) {
      yield { chunk: result.reply };
      yield { done: true, usage: result.usage };
    } else {
      yield { error: result.error || 'Aucun provider IA configuré. Activez OpenRouter, Mistral ou Groq dans /admin/ai' };
    }
    return;
  }

  let lastError: string | null = null;
  for (const provider of chain) {
    const providerConfig = (config.ai.providers as any)[provider];
    if (!providerConfig?.apiKey) continue;

    const model = QUALITY_MODELS_PER_PROVIDER[provider];
    const endpoint = getEndpoint(provider, providerConfig);
    const headers = buildHeaders(provider, providerConfig);

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: buildChatBody(model, opts, maxTokens, true),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      markError(provider, 'network');
      lastError = `${provider} réseau: ${(err as Error).message}`;
      continue;
    }

    if (!res.ok || !res.body) {
      const kind = classifyError(res.status);
      const errText = await res.text().catch(() => '');
      let errMsg = `HTTP ${res.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.message || errJson.error?.message || errMsg;
      } catch { /* not JSON */ }

      markError(provider, kind);
      lastError = `${provider}: ${errMsg}`;
      continue;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let gotAnyChunk = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const dataLines = evt.split('\n').filter((l) => l.startsWith('data:'));
          for (const line of dataLines) {
            const data = line.slice(5).trim();
            if (!data || data === '[DONE]') {
              markSuccess(provider);
              yield { done: true };
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.choices?.[0]?.delta?.content;
              if (typeof chunk === 'string' && chunk.length > 0) {
                gotAnyChunk = true;
                yield { chunk };
              }
              if (parsed.usage) {
                yield { usage: parsed.usage };
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      }
      if (gotAnyChunk) {
        markSuccess(provider);
        yield { done: true };
        return;
      }
      markError(provider, 'server');
      lastError = `${provider}: flux vide`;
      continue;
    } catch (err) {
      markError(provider, 'network');
      lastError = `${provider} stream: ${(err as Error).message}`;
      continue;
    }
  }

  yield { error: lastError || 'Tous les providers IA ont échoué. Réessayez dans 1 minute.' };
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
  // Scale timeout with max_tokens — short replies (chat) get a tighter budget
  // so the user gets fast errors instead of hanging for 3 minutes.
  const timeoutMs = maxTokens <= 1000 ? 45000 : 180000;

  // Mistral and Groq both use OpenAI-compatible /chat/completions endpoint
  if (provider === 'mistral' || provider === 'cerebras') {
    const endpoint = providerConfig.endpoint || (provider === 'mistral' ? 'https://api.mistral.ai/v1' : 'https://api.cerebras.ai/v1');
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
        signal: AbortSignal.timeout(timeoutMs),
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
        signal: AbortSignal.timeout(timeoutMs),
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
