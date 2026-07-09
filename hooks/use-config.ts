'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AppConfig } from '@/lib/config-store';
import { useToast } from '@/components/providers/toast-provider';

interface UseConfigResult {
  config: AppConfig | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  reload: () => Promise<void>;
  save: (updates: Partial<AppConfig>) => Promise<boolean>;
  test: (type: 'database' | 'ai' | 'payment' | 'email', provider?: string) => Promise<{ ok: boolean; message: string }>;
}

export function useConfig(): UseConfigResult {
  const { toast } = useToast();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/config', { credentials: 'include' });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      if (data.config) setConfig(data.config);
      else if (data.error) setError(data.error);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (updates: Partial<AppConfig>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ config: updates }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Échec de la sauvegarde', description: data.error || 'Erreur serveur', variant: 'error' });
        return false;
      }
      if (data.config) setConfig(data.config);
      toast({ title: 'Configuration enregistrée', description: 'Les modifications sont actives.', variant: 'success' });
      return true;
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  const test = useCallback(async (type: 'database' | 'ai' | 'payment' | 'email', provider?: string): Promise<{ ok: boolean; message: string }> => {
    try {
      const res = await fetch('/api/admin/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, provider }),
      });
      const data = await res.json();
      toast({
        title: data.ok ? 'Test réussi' : 'Test échoué',
        description: data.message,
        variant: data.ok ? 'success' : 'error',
      });
      return { ok: data.ok, message: data.message };
    } catch (err) {
      const msg = (err as Error).message;
      toast({ title: 'Erreur de test', description: msg, variant: 'error' });
      return { ok: false, message: msg };
    }
  }, [toast]);

  useEffect(() => { reload(); }, [reload]);

  return { config, loading, saving, error, reload, save, test };
}
