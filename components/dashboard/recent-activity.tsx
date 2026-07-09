// AfriLaunch AI — Recent Activity Feed
'use client';

import { motion } from 'framer-motion';
import {
  Palette, Share2, Zap, Users, CreditCard, FileText,
  TrendingUp, Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  type: 'branding' | 'social' | 'content' | 'audience' | 'payment' | 'content_publish' | 'analytics' | 'agent';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error';
}

interface RecentActivityProps {
  items?: ActivityItem[];
}

const defaultItems: ActivityItem[] = [
  { id: '1', type: 'branding', title: 'Nouveau logo généré', description: 'Par le Branding Agent — 4 variants', timestamp: 'Il y a 12 min', status: 'success' },
  { id: '2', type: 'social', title: 'Post publié sur Instagram', description: '+142 likes en 1h', timestamp: 'Il y a 1 h', status: 'success' },
  { id: '3', type: 'audience', title: '+47 abonnés TikTok', description: 'Pic d\'engagement sur la vidéo "Lancement"', timestamp: 'Il y a 3 h', status: 'success' },
  { id: '4', type: 'payment', title: 'Paiement reçu — Orange Money', description: '12 500 FCFA — Commande #4821', timestamp: 'Il y a 4 h', status: 'success' },
  { id: '5', type: 'content_publish', title: 'Newsletter programmée', description: 'Envoi demain à 09h00 (1 240 abonnés)', timestamp: 'Il y a 5 h', status: 'warning' },
  { id: '6', type: 'agent', title: 'Growth Agent a trouvé 3 opportunités', description: 'Nouveau créneau sur TikTok Afrique de l\'Ouest', timestamp: 'Il y a 7 h', status: 'success' },
];

const iconMap = {
  branding: { Icon: Palette, color: 'text-violet-400 bg-violet-500/10' },
  social: { Icon: Share2, color: 'text-green-400 bg-green-500/10' },
  content: { Icon: Zap, color: 'text-pink-400 bg-pink-500/10' },
  audience: { Icon: Users, color: 'text-cyan-400 bg-cyan-500/10' },
  payment: { Icon: CreditCard, color: 'text-teal-400 bg-teal-500/10' },
  content_publish: { Icon: FileText, color: 'text-orange-400 bg-orange-500/10' },
  analytics: { Icon: TrendingUp, color: 'text-sky-400 bg-sky-500/10' },
  agent: { Icon: Bot, color: 'text-indigo-400 bg-indigo-500/10' },
} as const;

export function RecentActivity({ items }: RecentActivityProps) {
  const list = items ?? defaultItems;

  return (
    <div className="space-y-1">
      {list.map((item, i) => {
        const { Icon, color } = iconMap[item.type];
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.timestamp}</span>
              {item.status === 'success' && <div className="status-dot active" />}
              {item.status === 'warning' && <div className="status-dot warning" />}
              {item.status === 'error' && <div className="status-dot error" />}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
