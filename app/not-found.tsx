// AfriLaunch AI — Custom 404 page (FR, dark, server-rendered)
import Link from 'next/link';
import type { Metadata } from 'next';
import { LogoLockup } from '@/components/logo-lockup';

export const metadata: Metadata = {
  title: '404 — Page introuvable',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-[#050508] text-white overflow-hidden mesh-bg flex items-center justify-center px-6">
      {/* Decorative gradient blobs (consistent with landing hero) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-3xl" />
      </div>

      <main className="relative z-10 max-w-2xl w-full text-center">
        {/* Logo lockup */}
        <Link href="/" className="inline-flex justify-center mb-10 group" aria-label="AfriLaunch AI — Accueil">
          <LogoLockup
            iconSize={48}
            variant="horizontal"
            showSlogan
            animated
            className="transition-transform group-hover:scale-105"
          />
        </Link>

        {/* 404 huge */}
        <p
          className="text-[120px] md:text-[180px] leading-none font-extrabold tracking-tight mb-2 bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 bg-clip-text text-transparent select-none"
          aria-hidden="true"
        >
          404
        </p>

        <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
          404 — Page introuvable
        </h1>

        <p className="text-base md:text-lg text-gray-400 max-w-md mx-auto mb-10 leading-relaxed">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 transition-all duration-300 hover:scale-105 shadow-xl shadow-indigo-500/30 font-semibold"
          >
            Retour à l'accueil
          </Link>
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl glass border border-white/10 hover:bg-white/10 transition-all duration-300 font-semibold"
          >
            Voir les tarifs
          </Link>
        </div>

        {/* Helper links */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
          <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
          <Link href="/register" className="hover:text-white transition-colors">Créer un compte</Link>
          <Link href="/about" className="hover:text-white transition-colors">À propos</Link>
          <Link href="/legal/terms" className="hover:text-white transition-colors">Conditions</Link>
          <Link href="/api-docs" className="hover:text-white transition-colors">API docs</Link>
        </div>
      </main>
    </div>
  );
}
