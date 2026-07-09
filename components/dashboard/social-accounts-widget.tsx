// AfriLaunch AI — Social Accounts Widget
'use client';

import { motion } from 'framer-motion';
import { Instagram, Facebook, Youtube, Twitter, Linkedin, MessageCircle, Plus, Share2 } from 'lucide-react';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/dashboard/empty-state';

type Platform = 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'linkedin' | 'whatsapp';

interface SocialAccount {
  id: string;
  platform: Platform;
  handle: string;
  followers: number;
  growth: number;
  connected: boolean;
  color: string;
  Icon: React.ElementType;
}

// Lucide does not ship a TikTok icon; MessageCircle (WhatsApp) is reserved
// for WhatsApp, and Youtube is closest in shape to TikTok's note glyph.
// Using Youtube keeps the visual hierarchy consistent with other platforms.

function formatNum(n: number) {
  if (n === 0) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

interface SocialAccountsWidgetProps {
  accounts?: SocialAccount[];
}

export function SocialAccountsWidget({ accounts = [] }: SocialAccountsWidgetProps) {
  const { toast } = useToast();

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={Share2}
        title="Aucun réseau connecté"
        description="Connectez Instagram, TikTok, Facebook et plus pour publier automatiquement et centraliser vos messages."
        action={{ label: 'Connecter mes réseaux', href: '/dashboard/social' }}
        gradient="from-green-500 to-emerald-600"
      />
    );
  }

  const totalFollowers = accounts.filter((a) => a.connected).reduce((sum, a) => sum + a.followers, 0);
  const connectedCount = accounts.filter((a) => a.connected).length;

  const handleConnect = (account: SocialAccount) => {
    // Demo only — real implementation would open an OAuth flow.
    toast({
      title: `Connexion ${account.platform}`,
      description: `OAuth ${account.platform} simulé en démo. L'implémentation réelle nécessite un backend.`,
      variant: 'warning',
    });
  };

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
        <div className="h-10 w-px bg-white/5" aria-hidden="true" />
        <div>
          <p className="text-2xl font-bold tabular-nums">
            {connectedCount}<span className="text-sm text-muted-foreground">/{accounts.length}</span>
          </p>
          <p className="text-xs text-muted-foreground">Comptes connectés</p>
        </div>
      </div>

      {/* Accounts list */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none p-0 m-0" aria-label="Comptes réseaux sociaux">
        {accounts.map((acc, i) => (
          <motion.li
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
              <acc.Icon className="w-4 h-4 text-white" aria-hidden="true" />
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
              <div className="status-dot active flex-shrink-0" aria-label="Connecté" />
            ) : (
              <button
                type="button"
                onClick={() => handleConnect(acc)}
                aria-label={`Connecter ${acc.platform}`}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
              >
                <Plus className="w-3 h-3" aria-hidden="true" />
                Connecter
              </button>
            )}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
