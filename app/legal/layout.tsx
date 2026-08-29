// AfriLaunch AI — Legal pages layout (terms, privacy, security, rgpd)
// Mini sticky header with logo + "Retour à l'accueil" so users landing on a
// legal page from Google can navigate back to the product.
import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Mini sticky header */}
      <header className="glass border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo size={28} compact className="transition-transform group-hover:scale-110" />
            <span className="font-bold text-sm">
              AfriLaunch <span className="gradient-text">AI</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold px-4 py-2 rounded-lg glass border border-white/10 hover:bg-white/10 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {children}
      </div>
    </div>
  );
}
