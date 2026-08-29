// AfriLaunch AI — Admin config API
// GET  /api/admin/config        — read full config (requires auth)
// PUT  /api/admin/config        — update config (requires auth)
// PATCH /api/admin/config       — partial update (requires auth)
//
// SECURITY: Sensitive fields (API keys, secrets, tokens, password hashes)
// are STRIPPED from the GET response. The admin UI gets a boolean
// `has<X>` flag instead, so it can display "✓ Configured" or "✗ Missing"
// without ever receiving the secret value. Updates send the new value
// only when changing it; an empty string "" is treated as "no change".

import { NextRequest, NextResponse } from 'next/server';
import { getConfig, updateConfig, validateSession, type AppConfig } from '@/lib/config-store';

async function requireAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

// Recursively walk an object and replace secret-looking values with a
// `has` flag. A field is considered "secret" if its key matches a
// known sensitive pattern OR its value looks like a long opaque token.
const SECRET_KEY_PATTERNS = [
  /passwordhash$/i,
  /password$/i,
  /^jwt/i,
  /apikey$/i,
  /secret$/i,
  /secretkey$/i,
  /token$/i,
  /accesstoken$/i,
  /accesssecret$/i,
  /webhooksecret$/i,
  /encryptionkey$/i,
  /bot.*token$/i,
  /^bottoken$/i,
  /authToken$/i,
  /clientSecret$/i,
];

function isSecretKey(key: string): boolean {
  return SECRET_KEY_PATTERNS.some((re) => re.test(key));
}

function looksLikeSecret(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.length < 8) return false;
  // Heuristic: long opaque strings (>= 16 chars) that aren't URLs/emails
  if (/^https?:\/\//.test(value)) return false;
  if (/^[^@]+@[^@]+\.[^@]+$/.test(value)) return false;
  // Mix of letters, digits, and symbols → likely a key
  return /^[a-zA-Z0-9_\-]{16,}$/.test(value) || value.length >= 24;
}

function maskValue(value: string): { has: boolean; preview: string } {
  if (!value) return { has: false, preview: '' };
  // Show first 4 and last 4 chars only
  if (value.length <= 8) return { has: true, preview: '••••' };
  return { has: true, preview: `${value.slice(0, 4)}••••${value.slice(-4)}` };
}

// Deep-clone + sanitize. We replace secret values with { has, preview }.
// Non-secret fields pass through unchanged.
function sanitizeForRead(input: unknown, keyPath = ''): unknown {
  if (Array.isArray(input)) {
    return input.map((v) => sanitizeForRead(v, keyPath));
  }
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      const path = keyPath ? `${keyPath}.${k}` : k;
      if (typeof v === 'string' && (isSecretKey(k) || looksLikeSecret(v))) {
        out[k] = maskValue(v);
      } else if (v && typeof v === 'object') {
        out[k] = sanitizeForRead(v, path);
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  return input;
}

// Inverse: when the admin sends an update, restore "no change" semantics.
// If a field looks like `{ has: true, preview: "xxxx••••yyyy" }` or is an
// empty string, we DROP it from the update so the existing value is kept.
function stripNoChangeFields(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(stripNoChangeFields);
  }
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (v && typeof v === 'object' && 'has' in v && 'preview' in v) {
        // Masked object returned unchanged by the admin UI → skip
        continue;
      }
      if (typeof v === 'string' && v === '') {
        // Empty string → admin didn't change it → skip
        continue;
      }
      out[k] = stripNoChangeFields(v);
    }
    return out;
  }
  return input;
}

export async function GET(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const config = await getConfig();
  return NextResponse.json({ config: sanitizeForRead(config) });
}

export async function PUT(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  let body: Partial<AppConfig>;
  try {
    const parsed = await req.json();
    body = (parsed.config ?? parsed) as Partial<AppConfig>;
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }
  const cleaned = stripNoChangeFields(body) as Partial<AppConfig>;
  const updated = await updateConfig(cleaned);
  return NextResponse.json({ ok: true, config: sanitizeForRead(updated) });
}

export async function PATCH(req: NextRequest) {
  return PUT(req);
}
