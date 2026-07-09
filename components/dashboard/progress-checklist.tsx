// AfriLaunch AI — Progress Checklist
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const defaultItems: ChecklistItem[] = [
  { id: '1', label: 'Créer votre organisation', description: 'Nommez votre business', completed: true, href: '/dashboard/organization' },
  { id: '2', label: 'Générer votre identité', description: 'Logo + charte graphique', completed: true, href: '/dashboard/identity' },
  { id: '3', label: 'Lancer votre site web', description: 'Landing page prête', completed: true, href: '/dashboard/website' },
  { id: '4', label: 'Connecter les réseaux sociaux', description: 'Au moins 2 comptes', completed: false, href: '/dashboard/social' },
  { id: '5', label: 'Créer votre premier contenu', description: 'Post ou vidéo IA', completed: false, href: '/dashboard/content' },
  { id: '6', label: 'Activer les paiements', description: 'Mobile Money ou carte', completed: false, href: '/dashboard/payments' },
  { id: '7', label: 'Lancer un agent IA', description: 'Branding, Content, etc.', completed: false, href: '/dashboard/agents' },
  { id: '8', label: 'Planifier une campagne', description: 'Pub ou newsletter', completed: false, href: '/dashboard/campaigns' },
  { id: '9', label: 'Configurer l\'analytics', description: 'Connecter vos sources', completed: false, href: '/dashboard/analytics' },
  { id: '10', label: 'Inviter votre équipe', description: 'Membres & rôles', completed: false, href: '/dashboard/team' },
];

export function ProgressChecklist({ items }: ProgressChecklistProps) {
  const list = items ?? defaultItems;

  return (
    <div className="space-y-1.5">
      <AnimatePresence>
        {list.map((item, i) => (
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
