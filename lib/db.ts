// AfriLaunch AI — Database abstraction layer
// Uses Supabase (PostgreSQL) in production, falls back to JSON files in local dev
// This replaces all fs.readFile/writeFile calls across the codebase

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigured = !!supabase;

// ─── Generic KV store ────────────────────────────────────────────────
// In Supabase: stored in `kv_store` table (key TEXT PK, value JSONB)
// In local dev: stored in ./data/{key}.json

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

  // Fallback: JSON file (local dev only — not available on Vercel serverless)
  if (process.env.VERCEL) return null; // Skip on Vercel to avoid fs warnings
  try {
    const fs = await (eval('import') as any)('fs/promises');
    const path = await (eval('import') as any)('path');
    const raw = await fs.readFile(
      path.join(process.cwd(), 'data', `${key}.json`),
      'utf-8',
    );
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

  // Fallback: JSON file (local dev only — not available on Vercel serverless)
  if (process.env.VERCEL) return; // Skip on Vercel to avoid fs warnings
  try {
    const fs = await (eval('import') as any)('fs/promises');
    const path = await (eval('import') as any)('path');
    const dir = path.join(process.cwd(), 'data');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `${key}.json`),
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

  // Fallback: local file (local dev only — not available on Vercel)
  if (process.env.VERCEL) throw new Error('File storage not available on Vercel');
  try {
    const fs = await (eval('import') as any)('fs/promises');
    const path = await (eval('import') as any)('path');
    const dir = path.join(process.cwd(), 'data', 'payment-proofs');
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, key);
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

  // Fallback: local file (local dev only — not available on Vercel)
  if (process.env.VERCEL) return null;
  try {
    const fs = await (eval('import') as any)('fs/promises');
    const path = await (eval('import') as any)('path');
    const filePath = path.join(process.cwd(), 'data', 'payment-proofs', key);
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
