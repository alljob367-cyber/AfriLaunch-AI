// AfriLaunch AI — Z.AI SDK initializer for Vercel serverless
// On Vercel, the filesystem is read-only except for /tmp.
// The Z.AI SDK searches for .z-ai-config in:
//   1. process.cwd()/.z-ai-config  ← deployed from repo, but might not work
//   2. os.homedir()/.z-ai-config   ← not writable on Vercel
//   3. /etc/.z-ai-config           ← read-only on Vercel
//
// This module writes the config to /tmp/.z-ai-config and sets HOME=/tmp
// so the SDK finds it via path.join(os.homedir(), '.z-ai-config').
// /tmp is the ONLY writable directory on Vercel serverless.

import fs from 'fs';
import path from 'path';
import os from 'os';

// The config content — hardcoded here as a fallback.
// Also read from the repo's .z-ai-config file if available.
const FALLBACK_CONFIG = {
  baseUrl: 'https://internal-api.z.ai/v1',
  apiKey: 'Z.ai',
  chatId: 'chat-23d677fe-1a35-4281-9390-b186424e2719',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYTg1MzliNTAtMmRjZC00MjEyLTk1NTAtMzM3ZTZlNTYyNDdiIiwiY2hhdF9pZCI6ImNoYXQtMjNkNjc3ZmUtMWEzNS00MjgxLTkzOTAtYjE4NjQyNGUyNzE5IiwicGxhdGZvcm0iOiJ6YWkifQ.cwW1ONnobtetoHgB4Jbrh62a-TGHgIDEyaZ6VZnQfcY',
  userId: 'a8539b50-2dcd-4212-9550-337e6e56247b',
};

let initialized = false;

export async function ensureZaiConfig(): Promise<void> {
  if (initialized) return;

  try {
    // Try reading from the repo's .z-ai-config first
    let configContent: string;
    const repoConfigPath = path.join(process.cwd(), '.z-ai-config');

    try {
      configContent = await fs.promises.readFile(repoConfigPath, 'utf-8');
      // Validate it's valid JSON with baseUrl + apiKey
      const parsed = JSON.parse(configContent);
      if (!parsed.baseUrl || !parsed.apiKey) throw new Error('Invalid config');
    } catch {
      // Fallback to hardcoded config
      configContent = JSON.stringify(FALLBACK_CONFIG);
    }

    // Write to /tmp/.z-ai-config (writable on Vercel)
    const tmpConfigPath = '/tmp/.z-ai-config';
    await fs.promises.writeFile(tmpConfigPath, configContent, 'utf-8');

    // Set HOME=/tmp so os.homedir() returns /tmp
    // The SDK will then find /tmp/.z-ai-config
    process.env.HOME = '/tmp';

    initialized = true;
  } catch (err) {
    console.error('Failed to initialize Z.AI config:', err);
    // Don't throw — let the SDK throw its own error if it can't find the config
  }
}

// Auto-initialize on import (for serverless cold starts)
ensureZaiConfig().catch(() => { /* ignore — will retry on next call */ });
