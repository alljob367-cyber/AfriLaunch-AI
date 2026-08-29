// AfriLaunch AI — Provider load balancer
// Routes AI requests across multiple providers (OpenRouter, Mistral, Groq)
// to maximize free-tier capacity and minimize rate-limit errors.
//
// Strategy:
//   1. Maintain a list of "candidate providers" ordered by priority.
//   2. Skip providers in "cooldown" (recent rate-limit or repeated errors).
//   3. Try providers in order. On 429 (rate limit) → mark cooldown 60s, try next.
//   4. On 5xx or network error → mark cooldown 30s, try next.
//   5. If all providers in cooldown → try the one with oldest cooldown expiry
//      (best chance of working).
//
// Health is in-memory per server instance (no persistence needed — it's
// transient state and resets on cold start, which is fine because provider
// state varies between Vercel serverless invocations anyway).

export type ProviderName = 'openrouter' | 'cerebras' | 'groq' | 'mistral';

interface ProviderHealth {
  name: ProviderName;
  enabled: boolean;
  apiKey: boolean;          // has a key configured?
  priority: number;         // 1 = highest
  consecutiveErrors: number;
  lastErrorAt: number | null;
  lastErrorKind: 'rate-limit' | 'auth' | 'network' | 'server' | 'unknown' | null;
  cooldownUntil: number | null; // epoch ms — skip this provider until this time
  totalRequests: number;
  totalSuccesses: number;
  totalErrors: number;
  // Computed fields (only set in snapshots, not in live HEALTH state)
  inCooldown?: boolean;
  cooldownSecondsLeft?: number;
  successRate?: number;
}

const HEALTH: Record<ProviderName, ProviderHealth> = {
  openrouter: {
    name: 'openrouter', enabled: false, apiKey: false, priority: 1,
    consecutiveErrors: 0, lastErrorAt: null, lastErrorKind: null,
    cooldownUntil: null, totalRequests: 0, totalSuccesses: 0, totalErrors: 0,
  },
  cerebras: {
    name: 'cerebras', enabled: false, apiKey: false, priority: 2,
    consecutiveErrors: 0, lastErrorAt: null, lastErrorKind: null,
    cooldownUntil: null, totalRequests: 0, totalSuccesses: 0, totalErrors: 0,
  },
  // Groq is very fast (Llama 3.3 70B + 8B instant) and cheap (large free tier
  // ≈ 43 200 req/day), so it sits right after cerebras in priority.
  groq: {
    name: 'groq', enabled: false, apiKey: false, priority: 3,
    consecutiveErrors: 0, lastErrorAt: null, lastErrorKind: null,
    cooldownUntil: null, totalRequests: 0, totalSuccesses: 0, totalErrors: 0,
  },
  mistral: {
    name: 'mistral', enabled: false, apiKey: false, priority: 4,
    consecutiveErrors: 0, lastErrorAt: null, lastErrorKind: null,
    cooldownUntil: null, totalRequests: 0, totalSuccesses: 0, totalErrors: 0,
  },
};

// Cooldown durations by error kind (ms)
const COOLDOWN_MS: Record<NonNullable<ProviderHealth['lastErrorKind']>, number> = {
  'rate-limit': 60_000,   // 60s — let the bucket refill
  'auth': 5 * 60_000,     // 5 min — key issues don't fix themselves quickly
  'network': 15_000,      // 15s — transient, retry fast
  'server': 30_000,       // 30s — provider 5xx, give them a moment
  'unknown': 30_000,
};

// Refresh health from config (called at the start of each request)
export function syncHealthFromConfig(config: any): void {
  const providers = config?.ai?.providers ?? {};
  for (const name of Object.keys(HEALTH) as ProviderName[]) {
    const p = providers[name];
    if (!p) continue;
    HEALTH[name].enabled = !!(p.enabled && p.apiKey);
    HEALTH[name].apiKey = !!p.apiKey;
  }
}

// Pick the next provider to try, given current health state.
// Returns null if no provider is configured.
export function pickProvider(): ProviderName | null {
  const now = Date.now();
  const available = (Object.values(HEALTH) as ProviderHealth[])
    .filter((p) => p.enabled && p.apiKey);

  if (available.length === 0) return null;

  // 1. Providers NOT in cooldown — try in priority order
  const fresh = available
    .filter((p) => !p.cooldownUntil || p.cooldownUntil <= now)
    .sort((a, b) => a.priority - b.priority);

  if (fresh.length > 0) return fresh[0].name;

  // 2. All in cooldown — pick the one whose cooldown expires soonest
  //    (best chance of being available)
  const sorted = available
    .sort((a, b) => (a.cooldownUntil ?? 0) - (b.cooldownUntil ?? 0));
  return sorted[0].name;
}

// Get the list of providers to try (in order) — for fallback chains
export function pickProviderChain(max = 3): ProviderName[] {
  const now = Date.now();
  const available = (Object.values(HEALTH) as ProviderHealth[])
    .filter((p) => p.enabled && p.apiKey);

  if (available.length === 0) return [];

  const fresh = available
    .filter((p) => !p.cooldownUntil || p.cooldownUntil <= now)
    .sort((a, b) => a.priority - b.priority);

  const cooled = available
    .filter((p) => p.cooldownUntil && p.cooldownUntil > now)
    .sort((a, b) => (a.cooldownUntil ?? 0) - (b.cooldownUntil ?? 0));

  // Try fresh first (priority order), then cooled (oldest first)
  return [...fresh, ...cooled].slice(0, max).map((p) => p.name);
}

// Classify an HTTP error response
export function classifyError(status: number): NonNullable<ProviderHealth['lastErrorKind']> {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate-limit';
  if (status >= 500) return 'server';
  return 'unknown';
}

// Mark a provider as having an error (called when a request fails)
export function markError(name: ProviderName, kind: NonNullable<ProviderHealth['lastErrorKind']>): void {
  const h = HEALTH[name];
  if (!h) return;
  h.consecutiveErrors += 1;
  h.lastErrorAt = Date.now();
  h.lastErrorKind = kind;
  h.totalErrors += 1;
  h.cooldownUntil = Date.now() + COOLDOWN_MS[kind];
}

// Mark a provider as healthy (called when a request succeeds)
export function markSuccess(name: ProviderName): void {
  const h = HEALTH[name];
  if (!h) return;
  h.consecutiveErrors = 0;
  h.lastErrorKind = null;
  h.cooldownUntil = null;
  h.totalRequests += 1;
  h.totalSuccesses += 1;
}

// Snapshot for UI/debugging
export function getHealthSnapshot(): ProviderHealth[] {
  const now = Date.now();
  return (Object.values(HEALTH) as ProviderHealth[]).map((h) => ({
    ...h,
    inCooldown: h.cooldownUntil !== null && h.cooldownUntil > now,
    cooldownSecondsLeft: h.cooldownUntil ? Math.max(0, Math.round((h.cooldownUntil - now) / 1000)) : 0,
    successRate: h.totalRequests + h.totalErrors > 0
      ? Math.round((h.totalSuccesses / (h.totalSuccesses + h.totalErrors)) * 100)
      : 100,
  }));
}

// Reset all health (admin action — useful after fixing a key)
export function resetHealth(): void {
  for (const name of Object.keys(HEALTH) as ProviderName[]) {
    HEALTH[name].consecutiveErrors = 0;
    HEALTH[name].lastErrorAt = null;
    HEALTH[name].lastErrorKind = null;
    HEALTH[name].cooldownUntil = null;
    HEALTH[name].totalRequests = 0;
    HEALTH[name].totalSuccesses = 0;
    HEALTH[name].totalErrors = 0;
  }
}
