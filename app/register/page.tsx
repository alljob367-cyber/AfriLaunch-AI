// AfriLaunch AI — Register Page
'use client';

import Link from 'next/link';
import { ArrowRight, Mail, Lock, User, Loader2, Gift } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { LogoLockup } from '@/components/logo-lockup';
import { Footer } from '@/components/footer';

function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') ?? '';

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referredBy, setReferredBy] = useState(refCode);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName,
          email,
          password,
          referredBy: referredBy || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast({ title: 'Échec de l\'inscription', description: data.error || 'Erreur', variant: 'error' });
        setSubmitting(false);
        return;
      }
      toast({
        title: 'Compte créé ! 🎉',
        description: referredBy
          ? 'Bienvenue ! + 100 crédits bonus de parrainage. Activez votre abonnement pour débloquer la plateforme.'
          : 'Bienvenue ! Activez votre abonnement (dès 5 000 FCFA/mois) pour débloquer la plateforme.',
        variant: 'success',
      });
      setTimeout(() => router.push('/dashboard/subscription'), 800);
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-violet-500/20 to-pink-500/20 blur-3xl animate-aurora" />
        <div className="absolute inset-0 dot-pattern opacity-20" />

        <div className="relative z-10 w-full max-w-md">
          <Link href="/" className="flex justify-center mb-8 group" aria-label="AfriLaunch AI — accueil">
            <LogoLockup
              iconSize={40}
              variant="horizontal"
              showSlogan
              animated
              className="transition-transform group-hover:scale-105"
            />
          </Link>

          <div className="glass rounded-3xl p-8 border border-white/10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-4">
              <span className="text-xs font-bold text-indigo-300">Dès 5 000 FCFA / mois · Mobile Money</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Lancez votre business 🚀</h1>
            <p className="text-sm text-gray-400 mb-8">Créez votre compte · Activez votre abonnement · Démarrez en 24h</p>

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
                    minLength={8}
                    pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
                    title="Au moins 8 caractères, dont 1 majuscule, 1 minuscule et 1 chiffre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent flex-1 outline-none text-sm"
                    autoComplete="new-password"
                    placeholder="8+ caractères, 1 maj, 1 min, 1 chiffre"
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-1.5">
                  Min. 8 caractères, dont 1 majuscule, 1 minuscule et 1 chiffre.
                </p>
              </div>

              {referredBy && (
                <div>
                  <label htmlFor="register-ref" className="text-xs font-semibold text-gray-400 mb-1.5 block flex items-center gap-1">
                    <Gift className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                    CODE DE PARRAINAGE
                  </label>
                  <div className="flex items-center gap-2 glass rounded-xl px-4 py-3 border border-emerald-500/30 bg-emerald-500/5">
                    <input
                      id="register-ref"
                      type="text"
                      value={referredBy}
                      onChange={(e) => setReferredBy(e.target.value)}
                      className="bg-transparent flex-1 outline-none text-sm font-mono text-emerald-300"
                    />
                    <span className="text-xs text-emerald-400 font-semibold">+50 crédits</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Création...</>
                ) : (
                  <>Créer mon compte <ArrowRight className="w-4 h-4" aria-hidden="true" /></>
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

      <Footer variant="compact" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
