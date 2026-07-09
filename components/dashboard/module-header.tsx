// AfriLaunch AI — Module page header (reusable for all /dashboard/* sub-routes)
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

interface ModuleHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  action?: React.ReactNode;
}

export function ModuleHeader({ title, description, icon: Icon, gradient, action }: ModuleHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard"
            className="mt-1 p-2 rounded-lg glass hover:bg-white/10 transition-colors lg:hidden"
            aria-label="Retour au tableau de bord"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">{description}</p>
          </div>
        </div>
        {action}
      </div>
    </motion.header>
  );
}

// Reusable card wrapper for module content
export function ModuleCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-premium ${className}`}>
      {children}
    </div>
  );
}

// Empty state for sections not yet implemented
export function ComingSoonCard({ feature }: { feature: string }) {
  return (
    <div className="card-premium text-center py-12">
      <div className="text-5xl mb-4" role="img" aria-label="En construction">🚧</div>
      <h3 className="text-lg font-bold mb-2">{feature} — Bientôt disponible</h3>
      <p className="text-sm text-gray-400 max-w-md mx-auto">
        Ce module est en cours de développement. Vous pouvez explorer les autres sections du tableau de bord
        ou nous contacter pour accéder à la version bêta.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:scale-105 transition-transform"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
