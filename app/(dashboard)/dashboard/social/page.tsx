// AfriLaunch AI — Réseaux sociaux (connexion simplifiée + publish + inbox)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, Instagram, Facebook, Youtube, Twitter, Linkedin, MessageCircle,
  Loader2, Check, X, Link2, Unlink, Users, MessageSquare, Sparkles, Send,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

type Platform = 'instagram' | 'tiktok' | 'facebook' | 'whatsapp' | 'linkedin' | 'twitter';

interface SocialAccount {
  id: string;
  platform: Platform;
  handle: string;
  displayName: string;
  followers: number;
  connected: boolean;
  connectedAt: string;
  bio?: string;
  verified?: boolean;
}

interface PlatformInfo {
  id: Platform;
  name: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  placeholder: string;
  helperText: string;
  connectLabel: string;
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: 'instagram', name: 'Instagram', icon: Instagram,
    color: 'text-pink-400', gradient: 'from-pink-500 to-rose-600',
    placeholder: 'votre_username', helperText: 'Votre nom d\'utilisateur Instagram (sans @)',
    connectLabel: 'Connecter Instagram',
  },
  {
    id: 'tiktok', name: 'TikTok', icon: Youtube,
    color: 'text-white', gradient: 'from-slate-700 to-slate-900',
    placeholder: 'votre_username', helperText: 'Votre nom d\'utilisateur TikTok (sans @)',
    connectLabel: 'Connecter TikTok',
  },
  {
    id: 'facebook', name: 'Facebook', icon: Facebook,
    color: 'text-blue-400', gradient: 'from-blue-500 to-blue-700',
    placeholder: 'Nom de votre Page', helperText: 'Le nom de votre Page Facebook Business',
    connectLabel: 'Connecter Facebook',
  },
  {
    id: 'whatsapp', name: 'WhatsApp Business', icon: MessageCircle,
    color: 'text-green-400', gradient: 'from-green-500 to-emerald-600',
    placeholder: '+237 6XX XXX XXX', helperText: 'Votre numéro WhatsApp Business (format international)',
    connectLabel: 'Connecter WhatsApp',
  },
  {
    id: 'linkedin', name: 'LinkedIn', icon: Linkedin,
    color: 'text-sky-400', gradient: 'from-sky-500 to-blue-700',
    placeholder: 'Nom de votre entreprise', helperText: 'Le nom de votre Page LinkedIn entreprise',
    connectLabel: 'Connecter LinkedIn',
  },
  {
    id: 'twitter', name: 'X (Twitter)', icon: Twitter,
    color: 'text-gray-300', gradient: 'from-slate-600 to-slate-800',
    placeholder: 'votre_username', helperText: 'Votre nom d\'utilisateur X/Twitter (sans @)',
    connectLabel: 'Connecter X',
  },
];

export default function SocialPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);
  const [handleInputs, setHandleInputs] = useState<Record<string, string>>({});
  const [showConnectForm, setShowConnectForm] = useState<Platform | null>(null);
  const [publishingPlatform, setPublishingPlatform] = useState<Platform | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState<Platform | null>(null);
  const [publishContent, setPublishContent] = useState('');

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/social/accounts', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        setAccounts(data.accounts);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const isConnected = (platform: Platform) => accounts.some((a) => a.platform === platform && a.connected);
  const getAccount = (platform: Platform) => accounts.find((a) => a.platform === platform);

  async function handleConnect(platform: Platform) {
    const handle = (handleInputs[platform] || '').trim().replace(/^@/, '');
    if (!handle) {
      toast({ title: 'Erreur', description: 'Entrez votre nom d\'utilisateur', variant: 'error' });
      return;
    }

    setConnectingPlatform(platform);
    try {
      const res = await fetch('/api/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platform, handle }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchAccounts();
        setShowConnectForm(null);
        setHandleInputs({ ...handleInputs, [platform]: '' });
        toast({
          title: `${PLATFORMS.find(p => p.id === platform)?.name} connecté ! ✅`,
          description: `@${handle} est maintenant lié à votre compte.`,
          variant: 'success',
        });
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setConnectingPlatform(null);
    }
  }

  async function handleDisconnect(platform: Platform) {
    try {
      const res = await fetch('/api/social/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchAccounts();
        toast({ title: 'Compte déconnecté', description: `${PLATFORMS.find(p => p.id === platform)?.name} n'est plus lié.`, variant: 'warning' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' });
    }
  }

  async function handlePublish(platform: Platform) {
    const content = publishContent.trim();
    if (!content) {
      toast({ title: 'Contenu vide', description: 'Écrivez quelque chose à publier.', variant: 'warning' });
      return;
    }
    setPublishingPlatform(platform);
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platform, content }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.manualShareUrl) {
          // Open manual share URL in new tab
          window.open(data.manualShareUrl, '_blank', 'noopener,noreferrer');
          toast({
            title: 'Lien de partage ouvert',
            description: 'Une fenêtre s\'est ouverte pour finaliser la publication.',
            variant: 'success',
          });
        } else {
          toast({
            title: 'Publication réussie ! ✅',
            description: 'Votre contenu est en ligne.',
            variant: 'success',
          });
        }
        setShowPublishDialog(null);
        setPublishContent('');
      } else {
        if (data.needConnect) {
          toast({ title: 'Compte non connecté', description: data.error, variant: 'warning' });
        } else {
          toast({ title: 'Échec publication', description: data.error, variant: 'error' });
        }
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setPublishingPlatform(null);
    }
  }

  const connectedCount = accounts.filter(a => a.connected).length;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-green-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-emerald-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-5xl mx-auto">
        <ModuleHeader
          title="Réseaux sociaux"
          description="Connectez vos comptes Instagram, TikTok, Facebook, WhatsApp, LinkedIn et X en un clic. Publiez et gérez tout depuis un seul endroit."
          icon={Share2}
          gradient="from-green-500 to-emerald-600"
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card-premium text-center">
            <p className="text-2xl font-bold gradient-text">{connectedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Comptes connectés</p>
          </div>
          <div className="card-premium text-center">
            <p className="text-2xl font-bold gradient-text">{6 - connectedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Restants</p>
          </div>
          <div className="card-premium text-center">
            <p className="text-2xl font-bold gradient-text">
              {accounts.reduce((sum, a) => sum + (a.followers || 0), 0).toLocaleString('fr-FR')}
            </p>
            <p className="text-xs text-gray-500 mt-1">Abonnés cumulés</p>
          </div>
        </div>

        {/* Platform cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORMS.map((platform, i) => {
            const account = getAccount(platform.id);
            const connected = isConnected(platform.id);
            const isThisConnecting = connectingPlatform === platform.id;
            const showForm = showConnectForm === platform.id;

            return (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'glass rounded-2xl p-5 border transition-all',
                  connected ? 'border-green-500/30' : 'border-white/5 hover:border-white/15',
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', platform.gradient)}>
                      <platform.icon className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{platform.name}</p>
                      {connected ? (
                        <p className="text-xs text-green-400 flex items-center gap-1">
                          <Check className="w-3 h-3" aria-hidden="true" />
                          @{account?.handle}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">Non connecté</p>
                      )}
                    </div>
                  </div>
                  {connected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-green-500/15 text-green-400 border border-green-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-500/15 text-gray-500 border border-gray-500/30">
                      Inactif
                    </span>
                  )}
                </div>

                {/* Connected state */}
                {connected && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Users className="w-3.5 h-3.5" aria-hidden="true" />
                        {(account?.followers || 0).toLocaleString('fr-FR')} abonnés
                      </span>
                      <span className="text-gray-600">
                        Connecté le {new Date(account?.connectedAt || '').toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPublishDialog(platform.id);
                          setPublishContent('');
                        }}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold glass border border-white/10 hover:bg-white/10 flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Publier
                      </button>
                      <a
                        href={
                          platform.id === 'instagram' ? `https://instagram.com/${account?.handle || ''}/direct/inbox`
                          : platform.id === 'facebook' ? `https://messenger.com`
                          : platform.id === 'whatsapp' ? `https://wa.me/${(account?.handle || '').replace(/[^0-9]/g, '')}`
                          : platform.id === 'linkedin' ? `https://linkedin.com/messaging`
                          : platform.id === 'twitter' ? `https://x.com/messages`
                          : '#'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-lg text-xs font-semibold glass border border-white/10 hover:bg-white/10 flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" /> Messages
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDisconnect(platform.id)}
                        aria-label={`Déconnecter ${platform.name}`}
                        className="px-3 py-2 rounded-lg text-xs font-semibold glass border border-red-500/20 text-red-400 hover:bg-red-500/10"
                      >
                        <Unlink className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Not connected — show connect form */}
                {!connected && !showForm && (
                  <button
                    type="button"
                    onClick={() => setShowConnectForm(platform.id)}
                    className={cn(
                      'w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r text-white hover:scale-[1.01] transition-transform shadow-lg flex items-center justify-center gap-2',
                      platform.gradient,
                    )}
                  >
                    <Link2 className="w-4 h-4" aria-hidden="true" /> {platform.connectLabel}
                  </button>
                )}

                {/* Connect form */}
                {!connected && showForm && (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor={`handle-${platform.id}`} className="text-xs font-semibold text-gray-400 mb-1 block">
                        {platform.helperText}
                      </label>
                      <div className="flex items-center gap-2 glass rounded-xl px-3 py-2.5 border border-white/5 focus-within:border-green-500/40">
                        {platform.id === 'whatsapp' ? null : <span className="text-gray-500">@</span>}
                        <input
                          id={`handle-${platform.id}`}
                          type="text"
                          value={handleInputs[platform.id] || ''}
                          onChange={(e) => setHandleInputs({ ...handleInputs, [platform.id]: e.target.value })}
                          placeholder={platform.placeholder}
                          className="bg-transparent flex-1 outline-none text-sm"
                          onKeyDown={(e) => { if (e.key === 'Enter') handleConnect(platform.id); }}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleConnect(platform.id)}
                        disabled={isThisConnecting}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.01] transition-transform shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {isThisConnecting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Check className="w-4 h-4" aria-hidden="true" />}
                        {isThisConnecting ? 'Connexion...' : 'Confirmer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConnectForm(null)}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold glass border border-white/10 hover:bg-white/10"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Info banner */}
        <div className="mt-6 glass rounded-2xl p-5 border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-blue-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-300 mb-1">Comment ça marche ?</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                1. Cliquez sur « Connecter » pour chaque réseau.{' '}
                2. Entrez votre nom d\'utilisateur (sans @).{' '}
                3. Cliquez « Confirmer ».{' '}
                Votre compte est lié instantanément — vous pouvez publier du contenu depuis le module Contenu ou depuis le bouton « Publier » ci-dessus.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Publish dialog */}
      <AnimatePresence>
        {showPublishDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPublishDialog(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 border border-white/10 max-w-lg w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const p = PLATFORMS.find((x) => x.id === showPublishDialog);
                    if (!p) return null;
                    return (
                      <>
                        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', p.gradient)}>
                          <p.icon className="w-5 h-5 text-white" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Publier sur {p.name}</p>
                          <p className="text-xs text-gray-500">@{getAccount(showPublishDialog)?.handle}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <button
                  type="button"
                  onClick={() => setShowPublishDialog(null)}
                  aria-label="Fermer"
                  className="p-2 rounded-lg hover:bg-white/5"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <textarea
                value={publishContent}
                onChange={(e) => setPublishContent(e.target.value)}
                placeholder="Que voulez-vous publier aujourd'hui ?"
                rows={5}
                autoFocus
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-violet-500/40 outline-none text-sm resize-none mb-3"
              />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-500">{publishContent.length} caractères</span>
                <span className="text-xs text-blue-300">
                  {showPublishDialog === 'whatsapp' || showPublishDialog === 'twitter'
                    ? 'Partage via lien ouvert dans un nouvel onglet'
                    : 'Publication directe si OAuth configuré'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handlePublish(showPublishDialog)}
                disabled={!publishContent.trim() || publishingPlatform === showPublishDialog}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-indigo-600 hover:scale-[1.01] transition-transform shadow-lg disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {publishingPlatform === showPublishDialog
                  ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  : <Send className="w-4 h-4" aria-hidden="true" />}
                {publishingPlatform === showPublishDialog ? 'Publication…' : 'Publier maintenant'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
