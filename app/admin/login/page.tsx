// AfriLaunch AI — Admin login page
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/providers/toast-provider';
import { LogoLockup } from '@/components/logo-lockup';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Already logged in? Redirect to /admin/general
    fetch('/api/admin/auth', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) router.replace('/admin/general');
        else setCheckingAuth(false);
      })
      .catch(() => setCheckingAuth(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !password) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Échec de connexion', description: data.error || 'Erreur', variant: 'error' });
        setLoading(false);
        return;
      }
      toast({
        title: 'Connexion réussie ✅',
        description: 'Admin connecté — accès illimité au dashboard activé.',
        variant: 'success',
      });
      setTimeout(() => router.replace('/admin/general'), 600);
    } catch (err) {
      toast({ title: 'Erreur réseau', description: 'Impossible de contacter le serveur', variant: 'error' });
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-red-500/15 to-orange-500/15 blur-3xl animate-aurora" />
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <LogoLockup
            iconSize={48}
            variant="vertical"
            showSlogan
            animated
          />
          <p className="text-xs text-gray-500 uppercase tracking-widest">Panneau d'administration</p>
        </div>

        <div className="glass rounded-3xl p-8 border border-red-500/20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
            <Lock className="w-3 h-3 text-red-400" aria-hidden="true" />
            <span className="text-xs font-bold text-red-400">ACCÈS RESTREINT</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Connexion administrateur</h1>
          <p className="text-sm text-gray-400 mb-8">
            Cette zone permet de configurer l'application en mode réel. Toutes les modifications sont sensibles.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-password" className="text-xs font-semibold text-gray-400 mb-1.5 block">MOT DE PASSE</label>
              <div className="flex items-center gap-2 glass rounded-xl px-4 py-3 border border-white/5 focus-within:border-red-500/50 transition-colors">
                <Lock className="w-4 h-4 text-gray-500" aria-hidden="true" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent flex-1 outline-none text-sm placeholder:text-gray-600"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500 shadow-lg shadow-red-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Connexion...</>
              ) : (
                <>Accéder au panneau <ArrowRight className="w-4 h-4" aria-hidden="true" /></>
              )}
            </button>
          </form>

          <div className="mt-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-300">
              <strong>Sécurité :</strong> Changez votre mot de passe immédiatement après la première connexion dans <strong>Général → Sécurité</strong>.
              <br />
              ⚠️ Si vous avez oublié votre mot de passe, contactez l'équipe technique ou utilisez la variable d'environnement <code className="font-mono bg-black/30 px-1.5 py-0.5 rounded">ADMIN_RESET_TOKEN</code> pour le réinitialiser.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          🔒 Toutes les connexions sont journalisées. Activité suspecte = blocage automatique.
        </p>
      </div>
    </div>
  );
}
