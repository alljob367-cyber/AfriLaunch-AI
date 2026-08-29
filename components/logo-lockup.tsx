// AfriLaunch AI — LogoLockup : icône + "AfriLaunch AI" + slogan optionnel
// Reproduit le lockup officiel du logo PRO :
//   [A stylisé]  AfriLaunch AI
//                LANCEZ. GÉREZ. DÉVELOPPEZ.
//
// Variants :
//   - "horizontal" : icône + texte à droite (default, pour nav/footer/auth)
//   - "vertical"   : icône au-dessus, texte en dessous (pour splash/404/legal)
//   - "compact"    : icône + texte court seulement (pour petits espaces)
//
// Le texte "AI" est en dégradé (cohérent avec le logo officiel).
// Le slogan utilise aussi le dégradé + est encadré par 2 lignes fines.
'use client';

import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';

interface LogoLockupProps {
  className?: string;
  iconSize?: number;
  variant?: 'horizontal' | 'vertical' | 'compact';
  showSlogan?: boolean;
  slogan?: string;
  subtitle?: string;
  /** "dark" = pour fond sombre (texte blanc), "light" = pour fond clair (texte noir) */
  theme?: 'dark' | 'light';
  /** Apply shimmer animation to "AI" text */
  animated?: boolean;
}

export function LogoLockup({
  className,
  iconSize = 40,
  variant = 'horizontal',
  showSlogan = false,
  slogan = 'LANCEZ. GÉREZ. DÉVELOPPEZ.',
  subtitle,
  theme = 'dark',
  animated = false,
}: LogoLockupProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-zinc-900';
  const subtitleColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const sloganColor = theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600';
  const lineColor = theme === 'dark' ? 'bg-indigo-400/40' : 'bg-indigo-500/40';

  const BrandText = (
    <div className="flex flex-col">
      <div className={cn('flex items-baseline gap-1.5 font-bold leading-tight', textColor)}>
        <span className="tracking-tight">AfriLaunch</span>
        <span className={cn('gradient-text', animated && 'text-shimmer animate-gradient-shift')}>AI</span>
      </div>
      {showSlogan && (
        <div className={cn('flex items-center gap-2 mt-1', sloganColor)}>
          <span className={cn('h-px w-6', lineColor)} />
          <span className="text-[9px] font-bold tracking-[0.18em] uppercase">{slogan}</span>
          <span className={cn('h-px w-6', lineColor)} />
        </div>
      )}
      {subtitle && (
        <p className={cn('text-[10px] mt-0.5', subtitleColor)}>{subtitle}</p>
      )}
    </div>
  );

  if (variant === 'vertical') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <Logo size={iconSize} />
        <div className="flex flex-col items-center text-center">
          {BrandText}
        </div>
      </div>
    );
  }

  // horizontal or compact
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Logo size={iconSize} compact={variant === 'compact'} />
      {BrandText}
    </div>
  );
}
