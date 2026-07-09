// AfriLaunch AI — Quick Actions Component
'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Palette, Globe, Zap, PenSquare, Video, Image, Mail,
  Share2, CreditCard, Phone, Bot, BarChart3, Megaphone,
} from 'lucide-react';

const actions = [
  {
    id: 'identity',
    label: 'Créer mon identité',
    description: 'Nom, logo, charte graphique',
    icon: Palette,
    href: '/dashboard/identity',
    gradient: 'from-violet-500 to-purple-600',
    new: true,
  },
  {
    id: 'website',
    label: 'Mon site web',
    description: 'Landing page, boutique...',
    icon: Globe,
    href: '/dashboard/website',
    gradient: 'from-blue-500 to-cyan-600',
    new: false,
  },
  {
    id: 'content',
    label: 'Créer du contenu',
    description: 'Posts, vidéos, flyers...',
    icon: PenSquare,
    href: '/dashboard/content',
    gradient: 'from-pink-500 to-rose-600',
    new: false,
  },
  {
    id: 'social',
    label: 'Réseaux sociaux',
    description: 'Connecter mes comptes',
    icon: Share2,
    href: '/dashboard/social',
    gradient: 'from-green-500 to-emerald-600',
    new: false,
  },
  {
    id: 'ai-agent',
    label: 'Agent IA',
    description: 'Marketplace d\'agents',
    icon: Bot,
    href: '/dashboard/agents',
    gradient: 'from-indigo-500 to-violet-600',
    new: true,
  },
  {
    id: 'campaign',
    label: 'Campagne marketing',
    description: 'Publicités et promotion',
    icon: Megaphone,
    href: '/dashboard/campaigns',
    gradient: 'from-orange-500 to-amber-600',
    new: false,
  },
  {
    id: 'payment',
    label: 'Solutions paiement',
    description: 'PayPal, Flutterwave...',
    icon: CreditCard,
    href: '/dashboard/payments',
    gradient: 'from-teal-500 to-green-600',
    new: false,
  },
  {
    id: 'analytics',
    label: 'Statistiques',
    description: 'Voir mes performances',
    icon: BarChart3,
    href: '/dashboard/analytics',
    gradient: 'from-sky-500 to-blue-600',
    new: false,
  },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {actions.map((action, i) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 20 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push(action.href)}
          className="relative group flex flex-col items-center p-4 rounded-2xl glass
                     hover:bg-white/10 transition-all duration-300 cursor-pointer text-center"
        >
          {/* New badge */}
          {action.new && (
            <span className="absolute -top-1.5 -right-1.5 badge-new text-[10px]">NEW</span>
          )}

          {/* Icon */}
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient}
                          flex items-center justify-center mb-3 shadow-lg
                          group-hover:scale-110 transition-transform duration-300`}>
            <action.icon className="w-6 h-6 text-white" />
          </div>

          {/* Text */}
          <span className="text-xs font-semibold leading-tight mb-1">{action.label}</span>
          <span className="text-[11px] text-muted-foreground leading-tight hidden sm:block">
            {action.description}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
