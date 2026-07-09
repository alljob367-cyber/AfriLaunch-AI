'use client';

// Returns the current user's organization.
// In production, this would fetch from the API. Without a backend, returns null
// and the dashboard shows an onboarding/empty state.

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl: string | null;
    };
  }>;
}

export function useOrganization(): {
  organization: Organization | null;
  isLoading: boolean;
  error: Error | null;
} {
  return {
    organization: null,
    isLoading: false,
    error: null,
  };
}
