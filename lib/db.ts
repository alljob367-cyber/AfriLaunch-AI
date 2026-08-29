// AfriLaunch AI — Database abstraction layer
// Uses Supabase (PostgreSQL) in production, falls back to JSON files in local dev
// This replaces all fs.readFile/writeFile calls across the codebase
//
// IMPORTANT: This module is SERVER-ONLY. The `fs`/`path` modules are loaded
// lazily via `eval('require')` so webpack does NOT try to bundle them for the
// browser. Calling kvGet/kvSet from a Client Component will still fail at
// runtime — only call them from Server Components / API routes.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigured = !!supabase;

// Lazy-load Node.js `fs` and `path` modules at runtime via `eval('require')`.
// This hides them from webpack's static analysis so they don't end up in the
// browser bundle, while still working correctly in the Node.js server runtime.
// (The previous `eval('import')('fs/promises')` pattern was broken in CJS
//  context — it threw "Cannot use import statement outside a module".)
function nodeRequire(): { fs: typeof import('fs/promises'); path: typeof import('path') } {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const req = eval('require') as NodeRequire;
  return {
    fs: req('fs/promises'),
    path: req('path'),
  };
}

// Resolve the data directory lazily (only when actually needed in Node runtime).
function getDataDir(): { data: string; proofs: string } {
  const { path } = nodeRequire();
  const data = path.join(process.cwd(), 'data');
  return { data, proofs: path.join(data, 'payment-proofs') };
}

// ─── Generic KV store ────────────────────────────────────────────────
// In Supabase: stored in `kv_store` table (key TEXT PK, value JSONB)
// In local dev / standalone server: stored in ./data/{key}.json
// On Vercel serverless without Supabase: silently no-ops (fs not writable).

export async function kvGet<T = any>(key: string): Promise<T | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('kv_store')
      .select('value')
      .eq('key', key)
      .single();
    if (error || !data) return null;
    return data.value as T;
  }

  // Vercel serverless: skip fs operations (filesystem is read-only)
  if (process.env.VERCEL) return null;
  try {
    const { fs, path } = nodeRequire();
    const { data: dataDir } = getDataDir();
    const raw = await fs.readFile(path.join(dataDir, `${key}.json`), 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvSet(key: string, value: any): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('kv_store')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
      });
    if (error) {
      console.error('[db] kvSet error:', error);
      throw error;
    }
    return;
  }

  // Vercel serverless: skip fs operations (filesystem is read-only)
  if (process.env.VERCEL) return;
  try {
    const { fs, path } = nodeRequire();
    const { data: dataDir } = getDataDir();
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(
      path.join(dataDir, `${key}.json`),
      JSON.stringify(value, null, 2),
      'utf-8',
    );
  } catch (err) {
    console.error('[db] kvSet file error:', err);
    throw err;
  }
}

// ─── File storage (for payment proofs, uploads) ──────────────────────
// In Supabase: stored as base64 in kv_store
// In local dev: stored in ./data/payment-proofs/

export async function storeFile(key: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
  if (supabase) {
    // Store as base64 in kv_store (simple approach, works for small files < 1MB)
    const base64 = fileBuffer.toString('base64');
    await kvSet(key, { base64, mimeType, size: fileBuffer.length });
    return key; // Return the key as the "file path"
  }

  if (process.env.VERCEL) throw new Error('File storage not available on Vercel without Supabase');
  try {
    const { fs, path } = nodeRequire();
    const { proofs: proofsDir } = getDataDir();
    await fs.mkdir(proofsDir, { recursive: true });
    const filePath = path.join(proofsDir, key);
    await fs.writeFile(filePath, fileBuffer);
    return filePath;
  } catch (err) {
    throw err;
  }
}

export async function getFile(key: string): Promise<{ data: Buffer; mimeType: string } | null> {
  if (supabase) {
    const stored = await kvGet<{ base64: string; mimeType: string }>(key);
    if (!stored) return null;
    return {
      data: Buffer.from(stored.base64, 'base64'),
      mimeType: stored.mimeType,
    };
  }

  if (process.env.VERCEL) return null;
  try {
    const { fs, path } = nodeRequire();
    const { proofs: proofsDir } = getDataDir();
    const filePath = path.join(proofsDir, key);
    const data = await fs.readFile(filePath);
    // Guess mime from extension
    const ext = path.extname(key).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.webp': 'image/webp', '.pdf': 'application/pdf',
    };
    return { data, mimeType: mimeMap[ext] || 'application/octet-stream' };
  } catch {
    return null;
  }
}
