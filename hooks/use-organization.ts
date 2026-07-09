'use client';

// Stub hook returning a fake organization — wires the dashboard to mock data
// so the preview renders without a backend.
export function useOrganization() {
  const organization = {
    id: 'org-teranga-mode',
    name: 'Teranga Mode',
    slug: 'teranga-mode',
    plan: 'pro',
    createdAt: '2025-01-12T09:30:00Z',
    members: [
      {
        id: 'm-1',
        role: 'OWNER',
        user: {
          id: 'u-1',
          firstName: 'Aïssatou',
          lastName: 'Diallo',
          email: 'aissatou@terangamode.sn',
          avatarUrl: null,
        },
      },
    ],
  };

  return {
    organization,
    isLoading: false,
    error: null as Error | null,
  };
}
