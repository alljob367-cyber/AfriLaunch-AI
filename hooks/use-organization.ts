'use client';

import { useEffect, useState, useCallback } from 'react';

export interface Organization {
  id: string;
  userId: string;
  name: string;
  description: string;
  country: string;
  industry: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useOrganization() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/organization', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOrganization(data.organization || null);
      } else {
        setOrganization(null);
      }
    } catch (err) {
      setError(err as Error);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    organization,
    isLoading,
    error,
    refresh,
  };
}
