-- AfriLaunch AI — Supabase Schema
-- Run this in Supabase SQL Editor

-- ─── KV Store ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE kv_store ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically, so we just need to block anon/authenticated
-- "USING (false)" blocks SELECT/UPDATE/DELETE for non-service roles
-- "WITH CHECK (false)" blocks INSERT for non-service roles
CREATE POLICY "block_all_public" ON kv_store
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Index
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store(key);

-- ─── Done ───────────────────────────────────────────────────────────
SELECT 'Schema created successfully! ✅' as message;
