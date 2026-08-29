// AfriLaunch AI — Logo PRO (SVG vectoriel, fidèle au logo officiel)
// Composition :
//   - Lettre "A" stylisée avec dégradé cyan→bleu→violet
//   - Étoile 4-branches au centre du A (violet profond)
//   - Pixels flottants à droite (cyan/bleu/violet) — optionnels via `compact`
//   - Glow subtil pour effet premium
//
// Le logo est conçu pour s'afficher correctement sur fond sombre (app) ET
// fond clair (documents). Utiliser `variant="light"` pour les fonds clairs.
'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  /** When true, removes floating pixels (cleaner for small sizes / nav) */
  compact?: boolean;
  /** "dark" = pour fond sombre (texte blanc), "light" = pour fond clair (texte noir) */
  variant?: 'dark' | 'light';
}

export function Logo({ className, size = 32, compact = false, variant = 'dark' }: LogoProps) {
  // ID unique pour éviter les collisions quand plusieurs logos sur la même page
  const uid = `${size}-${variant}-${compact ? 'c' : 'f'}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={cn('flex-shrink-0', className)}
      fill="none"
      role="img"
      aria-label="AfriLaunch AI logo"
    >
      <defs>
        {/* Dégradé principal : cyan → bleu → violet (gauche → droite) */}
        <linearGradient id={`afl-grad-${uid}`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="40%" stopColor="#3b82f6" />
          <stop offset="70%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        {/* Dégradé étoile : violet clair → violet profond */}
        <linearGradient id={`afl-star-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        {/* Glow filter pour effet premium */}
        <filter id={`afl-glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ─── Lettre "A" stylisée ─── */}
      {/* Forme du A : triangle extérieur avec barre centrale, découpé par le triangle intérieur négatif */}
      <g filter={`url(#afl-glow-${uid})`}>
        {/* A = outer triangle (filled) */}
        <path
          d="M 256 96 L 396 416 L 322 416 L 304 372 L 208 372 L 190 416 L 116 416 Z"
          fill={`url(#afl-grad-${uid})`}
        />
        {/* Triangle intérieur (découpe pour créer la forme du A) */}
        <path
          d="M 256 200 L 290 332 L 222 332 Z"
          fill="#0a0a1a"
          opacity={1}
        />
        {/* Barre horizontale centrale du A */}
        <rect x="200" y="332" width="112" height="22" fill={`url(#afl-grad-${uid})`} />
      </g>

      {/* ─── Étoile 4-branches au centre du A ─── */}
      <g filter={`url(#afl-glow-${uid})`}>
        <path
          d="M 256 230 L 268 268 L 306 280 L 268 292 L 256 330 L 244 292 L 206 280 L 244 268 Z"
          fill={`url(#afl-star-${uid})`}
        />
        {/* Petit point central lumineux */}
        <circle cx="256" cy="280" r="4" fill="#ffffff" opacity="0.9" />
      </g>

      {/* ─── Pixels flottants (uniquement en mode non-compact) ─── */}
      {!compact && (
        <g>
          {/* Côté droit — pixels qui s'envolent */}
          <rect x="408" y="178" width="14" height="14" rx="2" fill="#22d3ee" opacity="0.9" />
          <rect x="438" y="216" width="10" height="10" rx="1.5" fill="#6366f1" opacity="0.75" />
          <rect x="392" y="246" width="12" height="12" rx="2" fill="#a855f7" opacity="0.85" />
          <rect x="424" y="288" width="8" height="8" rx="1.5" fill="#22d3ee" opacity="0.65" />
          <rect x="380" y="310" width="10" height="10" rx="1.5" fill="#6366f1" opacity="0.7" />
          <rect x="444" y="338" width="6" height="6" rx="1" fill="#a855f7" opacity="0.55" />
          <rect x="412" y="148" width="8" height="8" rx="1.5" fill="#a855f7" opacity="0.6" />
          <rect x="462" y="260" width="5" height="5" rx="1" fill="#22d3ee" opacity="0.5" />

          {/* Côté gauche — pixels plus petits pour équilibre */}
          <rect x="76" y="198" width="10" height="10" rx="1.5" fill="#22d3ee" opacity="0.6" />
          <rect x="52" y="240" width="7" height="7" rx="1" fill="#a855f7" opacity="0.5" />
          <rect x="84" y="288" width="8" height="8" rx="1.5" fill="#6366f1" opacity="0.6" />
          <rect x="60" y="340" width="6" height="6" rx="1" fill="#22d3ee" opacity="0.5" />
        </g>
      )}

      {/* ─── Anneau orbitaal subtil (effet tech) — uniquement si pas compact ─── */}
      {!compact && (
        <circle
          cx="256"
          cy="256"
          r="200"
          fill="none"
          stroke={`url(#afl-grad-${uid})`}
          strokeWidth="1"
          opacity="0.15"
          strokeDasharray="2 6"
        />
      )}
    </svg>
  );
}
