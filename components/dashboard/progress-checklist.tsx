// AfriLaunch AI — Progress Checklist
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronRight, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/dashboard/empty-state';

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  href?: string;
}

interface ProgressChecklistProps {
  items?: ChecklistItem[];
}

export function ProgressChecklist({ items }: ProgressChecklistProps) {
  const list = items;

  if (!list || list.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="Parcours non démarré"
        description="Créez votre organisation pour débloquer votre parcours de configuration étape par étape."
        action={{ label: 'Créer mon organisation', href: '/dashboard/organization' }}
        gradient="from-indigo-500 to-violet-600"
      />
    );
  }

  return (
    <div className="space-y-1.5">
      <AnimatePresence>
        {list!.map((item, i) => (
          <motion.a
            key={item.id}
            href={item.href ?? '#'}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl transition-all duration-200 group cursor-pointer',
              item.completed ? 'opacity-60 hover:opacity-100' : 'hover:bg-white/5',
            )}
          >
            {item.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
            )}
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', item.completed && 'line-through text-gray-500')}>
                {item.label}
              </p>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </motion.a>
        ))}
      </AnimatePresence>
    </div>
  );
}
