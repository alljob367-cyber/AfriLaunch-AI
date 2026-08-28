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
// Falls back to the non-streaming runner (yielded as a single chunk) when the
// configured provider doesn't support SSE.
export interface StreamEvent {
  chunk?: string;
  error?: string;
  done?: boolean;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export async function* runAIForPlanFastStream(opts: RunOptions, plan: PlanId): AsyncGenerator<StreamEvent> {
  const config = await getConfig();
  const openrouter = config.ai.providers.openrouter;
  const maxTokens = opts.maxTokens ?? 800;
  const timeoutMs = maxTokens <= 1000 ? 45000 : 180000;

  // Fallback path: no OpenRouter → run synchronously and yield the whole reply
  if (!openrouter?.enabled || !openrouter.apiKey) {
    const result = await runAIForPlanFast(opts, plan);
    if (result.ok && result.reply) {
      yield { chunk: result.reply };
      yield { done: true, usage: result.usage };
    } else {
      yield { error: result.error || 'Réponse vide' };
    }
    return;
  }

  const targetModel = PLAN_MODELS_FAST[plan] || PLAN_MODELS_FAST.starter;
  const messages = [
    { role: 'system', content: opts.systemPrompt },
    ...(opts.history ?? []),
    { role: 'user', content: opts.userMessage },
  ];

  let res: Response;
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouter.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': openrouter.siteUrl || 'https://afrilaunch.ai',
        'X-Title': openrouter.appName || 'AfriLaunch AI',
      },
      body: JSON.stringify({
        model: targetModel,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: true,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    yield { error: `OpenRouter réseau: ${(err as Error).message}` };
    return;
  }

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    let errMsg = `HTTP ${res.status}`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.message || errJson.error?.message || errMsg;
    } catch { /* not JSON */ }
    if (res.status === 401) { yield { error: `OpenRouter: clé API invalide (401). ${errMsg}` }; return; }
    if (res.status === 402) { yield { error: `OpenRouter: crédits insuffisants (402). ${errMsg}` }; return; }
    if (res.status === 429) { yield { error: `OpenRouter: rate limit (429). ${errMsg}` }; return; }
    yield { error: `OpenRouter: ${errMsg}` };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      // SSE events are separated by a blank line ("\n\n")
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const evt of events) {
        // Each event can have multiple "data:" lines; we only care about the
        // ones that carry a JSON payload.
        const dataLines = evt.split('\n').filter((l) => l.startsWith('data:'));
        for (const line of dataLines) {
          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') {
            yield { done: true };
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (typeof chunk === 'string' && chunk.length > 0) {
              yield { chunk };
            }
            if (parsed.usage) {
              yield { usage: parsed.usage };
            }
            // Some providers emit a "finish_reason" on the last chunk
            if (parsed.choices?.[0]?.finish_reason === 'stop') {
              // Don't return yet — there may still be a [DONE] marker or a
              // final usage chunk. The reader will hit `done` naturally.
            }
          } catch {
            // skip invalid JSON
          }
        }
      }
    }
    // Stream ended without [DONE] — still emit done so the caller can finalize
    yield { done: true };
  } catch (err) {
    yield { error: `Stream interrompu: ${(err as Error).message}` };
  }
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
