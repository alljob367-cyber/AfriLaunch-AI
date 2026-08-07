// AfriLaunch AI — AI runner: calls the configured LLM provider
// Supports Mistral, Groq (OpenAI-compatible), and others via their APIs

import { getConfig, type AppConfig } from './config-store';

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
        signal: AbortSignal.timeout(60000),
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

  // For other providers (OpenAI, Anthropic, Gemini, Z.ai, custom) — simulated
  // Real implementation would use their respective SDKs
  return {
    ok: false,
    error: `Provider ${provider} non implémenté dans le runner. Configurez Mistral ou Groq dans /admin/ai`,
    provider,
  };
}
