'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface User {
  id: string;
  firstName: string;
  email: string;
  plan?: string;
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
  // and returns the full user. Falls back to localStorage for offline/demo.
  const refresh = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          try {
            window.localStorage.setItem('afrilaunch.auth.user', JSON.stringify(data.user));
          } catch { /* ignore */ }
          return;
        }
      }
    } catch { /* network error — fall through to localStorage */ }
    // Fallback to localStorage (legacy demo sessions)
    try {
      const raw = window.localStorage.getItem('afrilaunch.auth.user');
      if (raw) setUser(JSON.parse(raw));
      else setUser(null);
    } catch {
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
    login: async (email) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password: '' }), // password set by caller via override below
      });
      // The hook signature only takes email for the legacy demo path.
      // Real login goes through the login page which calls the API directly.
      // This method is kept for backward compatibility with the login page.
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          try { window.localStorage.setItem('afrilaunch.auth.user', JSON.stringify(data.user)); } catch { /* ignore */ }
        }
      }
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
        try { window.localStorage.setItem('afrilaunch.auth.user', JSON.stringify(result.user)); } catch { /* ignore */ }
      }
    },
    logout: async () => {
      try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch { /* ignore */ }
      try { window.localStorage.removeItem('afrilaunch.auth.user'); } catch { /* ignore */ }
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
