'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface User {
  id: string;
  firstName: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstName: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'afrilaunch.auth.user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readFromStorage(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeToStorage(user: User | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore quota / privacy mode errors */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start with null on both server and first client render to avoid
  // hydration mismatch. Then sync from localStorage in useEffect.
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(readFromStorage());
    setIsLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login: async (email) => {
      // Simulate async network call
      await new Promise((r) => setTimeout(r, 300));
      const next: User = {
        id: 'demo-user',
        firstName: email.split('@')[0] || 'Entrepreneur',
        email,
      };
      writeToStorage(next);
      setUser(next);
    },
    register: async (data) => {
      await new Promise((r) => setTimeout(r, 400));
      const next: User = {
        id: 'demo-user',
        firstName: data.firstName,
        email: data.email,
      };
      writeToStorage(next);
      setUser(next);
    },
    logout: () => {
      writeToStorage(null);
      setUser(null);
    },
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
