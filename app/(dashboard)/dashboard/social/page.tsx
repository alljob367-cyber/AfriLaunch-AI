// AfriLaunch AI — Réseaux sociaux module
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Share2, Instagram, Facebook, Youtube, Twitter, Linkedin,
  MessageCircle, Users, TrendingUp, TrendingDown, Plus,
  Reply, Inbox, type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface Account {
  id: string;
  platform: string;
  handle: string;
  icon: LucideIcon;
  color: string;
  connected: boolean;
  followers?: string;
  growth?: number;
}

interface Message {
  id: string;
  sender: string;
  platform: 'Instagram' | 'WhatsApp' | 'TikTok' | 'Facebook';
  preview: string;
  timestamp: string;
  unread?: boolean;
}

const accounts: Account[] = [
  { id: 'instagram', platform: 'Instagram', handle: '@teranga.mode', icon: Instagram, color: 'from-fuchsia-500 to-pink-600', connected: true, followers: '12,4k', growth: 12.4 },
  { id: 'tiktok', platform: 'TikTok', handle: '@terangamode', icon: Youtube, color: 'from-slate-700 to-black', connected: true, followers: '28,9k', growth: 28.7 },
  { id: 'facebook', platform: 'Facebook', handle: 'Teranga Mode', icon: Facebook, color: 'from-blue-600 to-blue-700', connected: true, followers: '5,3k', growth: 4.2 },
  { id: 'twitter', platform: 'Twitter / X', handle: '@terangamode', icon: Twitter, color: 'from-gray-700 to-gray-900', connected: true, followers: '1,8k', growth: -2.1 },
  { id: 'whatsapp', platform: 'WhatsApp Business', handle: '+221 77 XXX XX XX', icon: MessageCircle, color: 'from-green-500 to-emerald-600', connected: false },
  { id: 'linkedin', platform: 'LinkedIn', handle: 'Teranga Mode SARL', icon: Linkedin, color: 'from-sky-600 to-blue-700', connected: false },
];

const messages: Message[] = [
  { id: 'm1', sender: 'Aïssatou Diop', platform: 'Instagram', preview: 'Bonjour, est-ce que vous livrez à Thiès ?', timestamp: 'Il y a 12 min', unread: true },
  { id: 'm2', sender: 'Mamadou Sow', platform: 'WhatsApp', preview: 'Merci pour la confirmation de commande 🙏', timestamp: 'Il y a 1 h' },
  { id: 'm3', sender: 'Fatou Ndiaye', platform: 'TikTok', preview: 'Le reel est trop beau ! Vous avez d\'autres coloris ?', timestamp: 'Il y a 3 h', unread: true },
  { id: 'm4', sender: 'Page Facebook', platform: 'Facebook', preview: 'Nouveau commentaire sur votre publication.', timestamp: 'Hier' },
];

const messageIcon: Record<Message['platform'], LucideIcon> = {
  Instagram,
  WhatsApp: MessageCircle,
  TikTok: Youtube,
  Facebook,
};

export default function SocialPage() {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState<string | null>(null);

  const connectedCount = accounts.filter((a) => a.connected).length;
  const totalFollowers = '48,4k';

  const handleConnect = async (account: Account) => {
    setConnecting(account.id);
    toast({
      title: 'OAuth simulé',
      description: `Connexion à ${account.platform} en cours...`,
      variant: 'success',
    });
    await new Promise((r) => setTimeout(r, 1200));
    setConnecting(null);
    toast({
      title: `${account.platform} connecté`,
      description: 'Le compte est maintenant lié à votre tableau de bord.',
      variant: 'success',
    });
  };

  const handleReply = (message: Message) => {
    toast({
      title: 'Ouverture de la conversation',
      description: `Discussion avec ${message.sender} via ${message.platform}.`,
      variant: 'success',
    });
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-green-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-emerald-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Réseaux sociaux"
          description="Connectez et gérez WhatsApp Business, Instagram, TikTok, Facebook, LinkedIn et X depuis un seul tableau de bord."
          icon={Share2}
          gradient="from-green-500 to-emerald-600"
          action={
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Audience totale</p>
                <p className="text-lg font-bold tabular-nums">{totalFollowers}</p>
              </div>
              <button
                type="button"
                onClick={() => toast({ title: 'Programmation', description: 'Ouvrir le planificateur de publications.', variant: 'success' })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 transition-transform shadow-lg"
              >
                <Plus className="w-4 h-4" aria-hidden="true" /> Programmer
              </button>
            </div>
          }
        />

        {/* Connected accounts */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
          aria-labelledby="accounts-title"
        >
          <header className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" aria-hidden="true" />
              <h2 id="accounts-title" className="text-xl font-bold">Comptes connectés</h2>
            </div>
            <span className="text-xs text-gray-400">
              {connectedCount}/{accounts.length} comptes actifs
            </span>
          </header>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((account, i) => (
              <motion.li
                key={account.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all duration-300 flex items-center gap-4"
              >
                <div className={cn('w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0', account.color)}>
                  <account.icon className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{account.platform}</h3>
                    {account.connected && (
                      <span
                        className="status-dot active"
                        aria-label="Connecté"
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-mono truncate">{account.handle}</p>
                  {account.connected && account.followers && (
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <span className="tabular-nums text-gray-300">{account.followers} abonnés</span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5 font-semibold',
                          (account.growth ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                        )}
                      >
                        {(account.growth ?? 0) >= 0 ? (
                          <TrendingUp className="w-3 h-3" aria-hidden="true" />
                        ) : (
                          <TrendingDown className="w-3 h-3" aria-hidden="true" />
                        )}
                        {(account.growth ?? 0) >= 0 ? '+' : ''}{account.growth}%
                      </span>
                    </div>
                  )}
                </div>
                {account.connected ? (
                  <button
                    type="button"
                    onClick={() => toast({ title: `${account.platform} déconnecté`, description: 'Le compte a été retiré du tableau de bord.', variant: 'warning' })}
                    aria-label={`Déconnecter ${account.platform}`}
                    className="text-xs px-3 py-2 rounded-lg glass hover:bg-white/10 transition-colors"
                  >
                    Gérer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConnect(account)}
                    disabled={connecting === account.id}
                    aria-label={`Connecter ${account.platform}`}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    {connecting === account.id ? 'Connexion…' : 'Connecter'}
                  </button>
                )}
              </motion.li>
            ))}
          </ul>
        </motion.section>

        {/* Unified inbox */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          aria-labelledby="inbox-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <Inbox className="w-5 h-5 text-green-400" aria-hidden="true" />
            <h2 id="inbox-title" className="text-xl font-bold">Boîte de réception unifiée</h2>
            <span className="badge-new">2 non lus</span>
          </header>
          <ul className="space-y-3">
            {messages.map((message, i) => {
              const PlatformIcon = messageIcon[message.platform];
              return (
                <motion.li
                  key={message.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'glass rounded-2xl p-4 border transition-all duration-300 flex items-center gap-4',
                    message.unread ? 'border-green-500/30' : 'border-white/5 hover:border-white/15'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center flex-shrink-0">
                    <PlatformIcon className="w-5 h-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{message.sender}</h3>
                      {message.unread && (
                        <span className="w-2 h-2 rounded-full bg-green-400" aria-label="Non lu" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{message.preview}</p>
                  </div>
                  <span className="text-xs text-gray-500 hidden sm:block flex-shrink-0">{message.timestamp}</span>
                  <button
                    type="button"
                    onClick={() => handleReply(message)}
                    aria-label={`Répondre à ${message.sender} sur ${message.platform}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 transition-transform"
                  >
                    <Reply className="w-3.5 h-3.5" aria-hidden="true" /> Répondre
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </motion.section>
      </div>
    </div>
  );
}
