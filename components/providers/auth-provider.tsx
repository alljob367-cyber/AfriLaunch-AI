'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface User {
  id: string;
  firstName: string;
  email: string;
  plan?: string;
  planStatus?: string;
  credits?: number;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstName: string; email: string; password: string; referredBy?: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with server on mount — the /api/auth/me endpoint reads the cookie
  // and returns the user. NO localStorage fallback anymore: a malicious user
  // could previously inject `{plan:"enterprise", planStatus:"active"}` via
  // the console and bypass the payment wall client-side. The server remains
  // the single source of truth for all auth + plan state.
  const refresh = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          return;
        }
      }
      // 401 / 403 / network error → user is not authenticated
      setUser(null);
    } catch {
      // Network error (offline) → treat as not authenticated. The user will
      // be prompted to log in again when the connection is restored.
      setUser(null);
    }
  };

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login: async (_email, _password) => {
      // Legacy method signature kept for backward compatibility.
      // Real login goes through the login page which calls the API directly.
      // This method is a no-op — call refresh() afterwards to sync state.
      await refresh();
    },
    register: async (data) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Échec de l\'inscription');
      }
      if (result.user) {
        setUser(result.user);
      }
    },
    logout: async () => {
      try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch { /* ignore */ }
      setUser(null);
    },
    refresh,
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
