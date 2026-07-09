'use client';

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';

interface QueryContextValue {
  fetcher: <T>(url: string) => Promise<T>;
  invalidate: (key?: string) => void;
  lastInvalidated: number;
}

const QueryContext = createContext<QueryContextValue | undefined>(undefined);

// Minimal query provider stub — replaces react-query for the preview.
export function QueryProvider({ children }: { children: ReactNode }) {
  const [lastInvalidated, setLastInvalidated] = useState(0);

  const fetcher = useCallback(async <T,>(url: string): Promise<T> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }, []);

  const invalidate = useCallback((key?: string) => {
    setLastInvalidated(Date.now());
    // no-op in stub mode — real impl would refetch matching queries
    void key;
  }, []);

  const value = useMemo<QueryContextValue>(() => ({ fetcher, invalidate, lastInvalidated }), [fetcher, invalidate, lastInvalidated]);

  return <QueryContext.Provider value={value}>{children}</QueryContext.Provider>;
}

export function useQueryContext() {
  const ctx = useContext(QueryContext);
  if (!ctx) throw new Error('useQueryContext must be used within QueryProvider');
  return ctx;
}
