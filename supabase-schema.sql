-- AfriLaunch AI — Supabase Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- ─── KV Store (replaces all JSON files) ───────────────────────────────
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE kv_store ENABLE ROW LEVEL SECURITY;

-- Allow access only with service role key (server-side only)
-- No public access — all API calls go through our Next.js server
CREATE POLICY "No public read" ON kv_store FOR SELECT USING (false);
CREATE POLICY "No public write" ON kv_store FOR INSERT USING (false);
CREATE POLICY "No public update" ON kv_store FOR UPDATE USING (false);
CREATE POLICY "No public delete" ON kv_store FOR DELETE USING (false);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store(key);

-- ─── Insert default config ────────────────────────────────────────────
-- The app will auto-create the default config on first run if it doesn't exist.

-- ─── Verify ───────────────────────────────────────────────────────────
SELECT 'Schema created successfully! ✅' as message;
SELECT 'Table: kv_store' as info;
SELECT 'Columns: key (TEXT PK), value (JSONB), updated_at (TIMESTAMPTZ)' as info;
