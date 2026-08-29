// AfriLaunch AI — Logo component (PRO version)
// Reproduit le logo AfriLaunch AI PRO : "A" stylisé avec dégradé cyan→violet,
// étoile à 4 branches au centre, et pixels flottants.
'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  /** When true, removes floating pixels (cleaner for small sizes / nav) */
  compact?: boolean;
}

export function Logo({ className, size = 32, compact = false }: LogoProps) {
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
        {/* Main gradient: cyan -> indigo -> violet */}
        <linearGradient id="afl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="45%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        {/* Star gradient: violet -> deep purple */}
        <linearGradient id="afl-star" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        {/* Soft glow */}
        <filter id="afl-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Letter "A" with cutout triangle (fill-rule evenodd) + base bar */}
      <path
        d="M 256 96 L 384 416 L 322 416 L 304 372 L 208 372 L 190 416 L 128 416 Z M 256 224 L 286 332 L 226 332 Z"
        fill="url(#afl-grad)"
        fillRule="evenodd"
        filter="url(#afl-glow)"
      />

      {/* Star (4-pointed) at the heart of the A */}
      <path
        d="M 256 236 L 270 264 L 298 278 L 270 292 L 256 320 L 242 292 L 214 278 L 242 264 Z"
        fill="url(#afl-star)"
        filter="url(#afl-glow)"
      />

      {/* Floating pixels — only when not compact */}
      {!compact && (
        <>
          {/* Right side */}
          <rect x="408" y="178" width="14" height="14" rx="2" fill="#22d3ee" opacity="0.85" />
          <rect x="438" y="216" width="10" height="10" rx="1.5" fill="#6366f1" opacity="0.7" />
          <rect x="392" y="246" width="12" height="12" rx="2" fill="#a855f7" opacity="0.8" />
          <rect x="424" y="288" width="8" height="8" rx="1.5" fill="#22d3ee" opacity="0.6" />
          <rect x="380" y="310" width="10" height="10" rx="1.5" fill="#6366f1" opacity="0.7" />
          <rect x="444" y="338" width="6" height="6" rx="1" fill="#a855f7" opacity="0.5" />
          {/* Left side */}
          <rect x="76" y="198" width="10" height="10" rx="1.5" fill="#22d3ee" opacity="0.6" />
          <rect x="52" y="240" width="7" height="7" rx="1" fill="#a855f7" opacity="0.5" />
          <rect x="84" y="288" width="8" height="8" rx="1.5" fill="#6366f1" opacity="0.6" />
        </>
      )}
    </svg>
  );
}
