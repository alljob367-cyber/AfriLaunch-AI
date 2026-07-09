// AfriLaunch AI — Social Accounts Widget
'use client';

import { motion } from 'framer-motion';
import { Instagram, Facebook, Youtube, Twitter, Linkedin, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialAccount {
  id: string;
  platform: 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'linkedin' | 'whatsapp';
  handle: string;
  followers: number;
  growth: number; // percent
  connected: boolean;
  color: string;
  Icon: React.ElementType;
}

const accounts: SocialAccount[] = [
  { id: '1', platform: 'instagram', handle: '@teranga.mode', followers: 12480, growth: 12.4, connected: true, color: 'from-pink-500 to-rose-600', Icon: Instagram },
  { id: '2', platform: 'tiktok', handle: '@terangamode', followers: 28940, growth: 28.7, connected: true, color: 'from-slate-700 to-slate-900', Icon: Youtube },
  { id: '3', platform: 'facebook', handle: 'Teranga Mode', followers: 5320, growth: 4.2, connected: true, color: 'from-blue-500 to-blue-700', Icon: Facebook },
  { id: '4', platform: 'twitter', handle: '@terangamode', followers: 1840, growth: -2.1, connected: true, color: 'from-slate-600 to-slate-800', Icon: Twitter },
  { id: '5', platform: 'whatsapp', handle: '+221 77 123 45 67', followers: 0, growth: 0, connected: false, color: 'from-green-500 to-emerald-600', Icon: MessageCircle },
  { id: '6', platform: 'linkedin', handle: 'Teranga Mode SARL', followers: 420, growth: 8.5, connected: false, color: 'from-sky-500 to-blue-700', Icon: Linkedin },
];

function formatNum(n: number) {
  if (n === 0) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export function SocialAccountsWidget() {
  const totalFollowers = accounts.filter((a) => a.connected).reduce((sum, a) => sum + a.followers, 0);
  const connectedCount = accounts.filter((a) => a.connected).length;

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-6 mb-5 pb-5 border-b border-white/5">
        <div>
          <p className="text-2xl font-bold tabular-nums">
            {formatNum(totalFollowers)}
          </p>
          <p className="text-xs text-muted-foreground">Abonnés cumulés</p>
        </div>
        <div className="h-10 w-px bg-white/5" />
        <div>
          <p className="text-2xl font-bold tabular-nums">
            {connectedCount}<span className="text-sm text-muted-foreground">/{accounts.length}</span>
          </p>
          <p className="text-xs text-muted-foreground">Comptes connectés</p>
        </div>
      </div>

      {/* Accounts list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {accounts.map((acc, i) => (
          <motion.div
            key={acc.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-all',
              acc.connected
                ? 'glass border-white/5 hover:border-white/15'
                : 'border-dashed border-white/10 hover:border-white/20',
            )}
          >
            <div className={cn(
              'w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0',
              acc.color,
              !acc.connected && 'opacity-40',
            )}>
              <acc.Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{acc.handle}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {acc.connected ? (
                  <>
                    <span className="tabular-nums">{formatNum(acc.followers)} abonnés</span>
                    {acc.growth !== 0 && (
                      <span className={cn('font-semibold', acc.growth > 0 ? 'text-green-500' : 'text-red-500')}>
                        {acc.growth > 0 ? '+' : ''}{acc.growth}%
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500">Non connecté</span>
                )}
              </div>
            </div>
            {acc.connected ? (
              <div className="status-dot active flex-shrink-0" />
            ) : (
              <button className="text-[10px] font-bold text-primary hover:underline">
                + Connecter
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
