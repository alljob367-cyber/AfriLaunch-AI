// AfriLaunch AI — Login Page
'use client';

import Link from 'next/link';
import { Rocket, ArrowRight, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('demo@afrilaunch.ai');
  const [password, setPassword] = useState('demo1234');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login(email, password);
      toast({ title: 'Connexion réussie', description: 'Redirection vers le dashboard...', variant: 'success' });
      // Brief delay so the user can see the success toast before navigation.
      setTimeout(() => router.push('/dashboard'), 600);
    } catch (err) {
      console.error('[login]', err);
      toast({ title: 'Erreur de connexion', description: 'Vérifiez vos identifiants.', variant: 'error' });
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-500/20 blur-3xl animate-aurora" />
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl">AfriLaunch <span className="gradient-text">AI</span></span>
        </Link>

        <div className="glass rounded-3xl p-8 border border-white/10">
          <h1 className="text-2xl font-bold mb-2">Bon retour 👋</h1>
          <p className="text-sm text-gray-400 mb-8">Connectez-vous à votre compte</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="text-xs font-semibold text-gray-400 mb-1.5 block">EMAIL</label>
              <div className="flex items-center gap-2 glass rounded-xl px-4 py-3 border border-white/5 focus-within:border-indigo-500/50 transition-colors">
                <Mail className="w-4 h-4 text-gray-500" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent flex-1 outline-none text-sm placeholder:text-gray-600"
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="text-xs font-semibold text-gray-400 mb-1.5 block">MOT DE PASSE</label>
              <div className="flex items-center gap-2 glass rounded-xl px-4 py-3 border border-white/5 focus-within:border-indigo-500/50 transition-colors">
                <Lock className="w-4 h-4 text-gray-500" aria-hidden="true" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent flex-1 outline-none text-sm placeholder:text-gray-600"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Créer un compte
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          🎬 Démo : cliquez sur &quot;Se connecter&quot; pour explorer le dashboard
        </p>
      </div>
    </div>
  );
}
