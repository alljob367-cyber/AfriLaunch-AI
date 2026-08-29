// AfriLaunch AI — Particles (particules lumineuses qui montent en arrière-plan)
'use client';

import { useMemo } from 'react';

const COLORS = ['#6366f1', '#a855f7', '#22d3ee', '#8b5cf6', '#3b82f6'];

export function Particles({ count = 15 }: { count?: number }) {
  // Génère des particules stables (memo pour éviter re-render)
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      color: COLORS[i % COLORS.length],
      duration: 8 + Math.random() * 8,
      delay: Math.random() * 12,
      opacity: 0.3 + Math.random() * 0.5,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-particle-rise"
          style={{
            left: `${p.left}%`,
            bottom: 0,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}
