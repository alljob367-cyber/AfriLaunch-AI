// AfriLaunch AI — Reusable empty state component
'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  gradient?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  gradient = 'from-indigo-500 to-violet-600',
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}
    >
      <div className={cn(
        'w-16 h-16 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-lg mb-5',
        gradient,
      )}>
        <Icon className="w-8 h-8 text-white" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-md mb-6 leading-relaxed">{description}</p>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r text-white hover:scale-105 transition-transform shadow-lg',
              gradient,
            )}
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r text-white hover:scale-105 transition-transform shadow-lg',
              gradient,
            )}
          >
            {action.label}
          </button>
        )
      )}
    </motion.div>
  );
}
