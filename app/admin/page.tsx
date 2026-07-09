// AfriLaunch AI — Admin root redirect (client-side)
// /admin → checks auth via API, redirects to /admin/general or /admin/login

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated as admin
    fetch('/api/admin/auth', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          router.replace('/admin/general');
        } else {
          router.replace('/admin/login');
        }
      })
      .catch(() => {
        router.replace('/admin/login');
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm text-gray-500">Redirection...</p>
      </div>
    </div>
  );
}
