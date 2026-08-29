// AfriLaunch AI — Logo component (inline SVG, guaranteed rendering)
'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 32 }: LogoProps) {
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
        <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="logo-rocket" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
        <linearGradient id="logo-flame" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <filter id="logo-glow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="512" height="512" rx="120" fill="url(#logo-bg)" />
      {/* Rocket body */}
      <path
        d="M256 100 C 280 100 310 140 310 220 L 310 320 L 202 320 L 202 220 C 202 140 232 100 256 100 Z"
        fill="url(#logo-rocket)"
        filter="url(#logo-glow)"
      />
      {/* Window */}
      <circle cx="256" cy="200" r="22" fill="#1e1b4b" opacity="0.3" />
      <circle cx="256" cy="200" r="18" fill="#6366f1" opacity="0.6" />
      <circle cx="252" cy="196" r="6" fill="#ffffff" opacity="0.8" />
      {/* Fins */}
      <path d="M202 280 L 160 340 L 160 380 L 202 340 Z" fill="url(#logo-rocket)" opacity="0.9" />
      <path d="M310 280 L 352 340 L 352 380 L 310 340 Z" fill="url(#logo-rocket)" opacity="0.9" />
      {/* Flame */}
      <path
        d="M230 320 C 230 360 240 390 256 420 C 272 390 282 360 282 320 Z"
        fill="url(#logo-flame)"
        filter="url(#logo-glow)"
      />
      <path d="M244 320 C 244 345 250 365 256 385 C 262 365 268 345 268 320 Z" fill="#fde047" opacity="0.9" />
      {/* Stars */}
      <circle cx="120" cy="150" r="3" fill="#ffffff" opacity="0.6" />
      <circle cx="400" cy="120" r="2" fill="#ffffff" opacity="0.5" />
      <circle cx="380" cy="380" r="2.5" fill="#ffffff" opacity="0.4" />
      <circle cx="100" cy="350" r="2" fill="#ffffff" opacity="0.5" />
      <circle cx="420" cy="250" r="1.5" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}
