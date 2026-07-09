// AfriLaunch AI — Register Page
'use client';

import Link from 'next/link';
import { Rocket, ArrowRight, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

function RegisterForm() {
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planFromQuery = searchParams.get('plan');

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await register({ firstName, email, password });
      toast({
        title: 'Compte créé !',
        description: planFromQuery
          ? `Bienvenue sur AfriLaunch AI — plan ${planFromQuery} activé 🎉`
          : 'Bienvenue sur AfriLaunch AI 🎉',
        variant: 'success',
      });
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (err) {
      console.error('[register]', err);
      toast({ title: 'Erreur d\'inscription', description: 'Veuillez réessayer.', variant: 'error' });
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-violet-500/20 to-pink-500/20 blur-3xl animate-aurora" />
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl">AfriLaunch <span className="gradient-text">AI</span></span>
        </Link>

        <div className="glass rounded-3xl p-8 border border-white/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 mb-4">
            <span className="text-xs font-bold text-green-400">✓ Essai gratuit 14 jours</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Lancez votre business 🚀</h1>
          <p className="text-sm text-gray-400 mb-8">Aucune carte bancaire requise</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="register-firstname" className="text-xs font-semibold text-gray-400 mb-1.5 block">PRÉNOM</label>
              <div className="flex items-center gap-2 glass rounded-xl px-4 py-3 border border-white/5 focus-within:border-indigo-500/50 transition-colors">
                <User className="w-4 h-4 text-gray-500" aria-hidden="true" />
                <input
                  id="register-firstname"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-transparent flex-1 outline-none text-sm"
                  autoComplete="given-name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="text-xs font-semibold text-gray-400 mb-1.5 block">EMAIL</label>
              <div className="flex items-center gap-2 glass rounded-xl px-4 py-3 border border-white/5 focus-within:border-indigo-500/50 transition-colors">
                <Mail className="w-4 h-4 text-gray-500" aria-hidden="true" />
                <input
                  id="register-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent flex-1 outline-none text-sm"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-password" className="text-xs font-semibold text-gray-400 mb-1.5 block">MOT DE PASSE</label>
              <div className="flex items-center gap-2 glass rounded-xl px-4 py-3 border border-white/5 focus-within:border-indigo-500/50 transition-colors">
                <Lock className="w-4 h-4 text-gray-500" aria-hidden="true" />
                <input
                  id="register-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent flex-1 outline-none text-sm"
                  autoComplete="new-password"
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
                  Création...
                </>
              ) : (
                <>
                  Créer mon compte gratuit
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Se connecter
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          En continuant, vous acceptez nos Conditions d&apos;utilisation et notre Politique de confidentialité.
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  // useSearchParams() must be inside a Suspense boundary per Next.js 16 requirements
  // for static rendering.
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
