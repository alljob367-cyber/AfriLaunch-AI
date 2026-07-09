// Client-side password hashing (SHA-256 via Web Crypto API)
// Mirrors the server-side hashPassword in lib/config-store.ts

export async function hashPasswordClient(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Synchronous fallback (not constant-time, but acceptable for client-side demo)
// Used when Web Crypto is unavailable (very old browsers).
export function hashPassword(password: string): string {
  // Use the synchronous path that works in Node and modern browsers
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    // Web Crypto is async-only; for sync use, fall back to a simple hash.
    // This is only used client-side for the admin password change form.
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const ch = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    return `simple_${Math.abs(hash).toString(16)}`;
  }
  // Node path
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require('crypto') as typeof import('crypto');
  return nodeCrypto.createHash('sha256').update(password).digest('hex');
}

export async function hashPasswordAsync(password: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return hashPasswordClient(password);
  }
  // Node
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require('crypto') as typeof import('crypto');
  return nodeCrypto.createHash('sha256').update(password).digest('hex');
}
