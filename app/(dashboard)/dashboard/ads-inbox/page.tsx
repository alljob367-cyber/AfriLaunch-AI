// AfriLaunch AI — Boîte de réception Ads (unified inbox for Facebook, Google, YouTube)
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox, Facebook, Youtube, Chrome, RefreshCw, X, Check, AlertCircle,
  Loader2, Star, Send, Pencil, Sparkles, ExternalLink, Mail, Phone, User,
  Radio, MessageSquare, MessageCircle, FileText, Clock, XCircle,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

// ─── Types (mirror server AdsItem) ────────────────────────────────────
type AdsPlatform = 'facebook' | 'google' | 'youtube';
type ItemType = 'comment' | 'message' | 'lead';
type ResponseStatus = 'pending' | 'responded' | 'failed' | 'manual';
type Sentiment = 'positive' | 'neutral' | 'negative' | 'question';

interface AdsItem {
  id: string;
  platform: AdsPlatform;
  type: ItemType;
  authorName: string;
  message: string;
  postUrl?: string;
  postCaption?: string;
  receivedAt: string;
  aiResponse: string | null;
  aiResponseStatus: ResponseStatus;
  aiRespondedAt: string | null;
  aiModel?: string;
  aiProvider?: string;
  isRead: boolean;
  isStarred: boolean;
  sentiment: Sentiment;
  leadEmail?: string;
  leadPhone?: string;
  leadName?: string;
}

interface AdsStats {
  total: number;
  byPlatform: Record<AdsPlatform, number>;
  byStatus: Record<ResponseStatus, number>;
  unreadCount: number;
  respondedCount: number;
  pendingCount: number;
  last24hCount: number;
}

type PlatformFilter = 'all' | AdsPlatform;
type StatusFilter = 'all' | 'pending' | 'responded';

// ─── Helpers ──────────────────────────────────────────────────────────
function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const sec = Math.max(1, Math.floor(diff / 1000));
  if (sec < 60) return `il y a ${sec} s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  const w = Math.floor(d / 7);
  if (w < 5) return `il y a ${w} sem`;
  const mo = Math.floor(d / 30);
  return `il y a ${mo} mois`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return '?';
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

function platformLabel(p: AdsPlatform): string {
  return p === 'facebook' ? 'Facebook' : p === 'google' ? 'Google' : 'YouTube';
}

function typeLabel(t: ItemType): string {
  return t === 'comment' ? 'Commentaire' : t === 'message' ? 'Message' : 'Lead';
}

function typeIcon(t: ItemType) {
  return t === 'comment' ? MessageSquare : t === 'message' ? MessageCircle : FileText;
}

function sentimentStyle(s: Sentiment): { label: string; className: string } {
  switch (s) {
    case 'positive':
      return { label: 'Positif', className: 'bg-green-500/15 text-green-400 border-green-500/30' };
    case 'negative':
      return { label: 'Négatif', className: 'bg-red-500/15 text-red-400 border-red-500/30' };
    case 'question':
      return { label: 'Question ?', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
    default:
      return { label: 'Neutre', className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' };
  }
}

function statusInfo(s: ResponseStatus): { label: string; dot: string; icon: typeof Check; iconCls: string; badgeCls: string } {
  switch (s) {
    case 'responded':
      return { label: 'Répondu', dot: 'bg-green-500', icon: Check, iconCls: 'text-green-400', badgeCls: 'bg-green-500/15 text-green-400 border-green-500/30' };
    case 'pending':
      return { label: 'En attente', dot: 'bg-amber-500', icon: Clock, iconCls: 'text-amber-400', badgeCls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    case 'failed':
      return { label: 'Échec', dot: 'bg-red-500', icon: XCircle, iconCls: 'text-red-400', badgeCls: 'bg-red-500/15 text-red-400 border-red-500/30' };
    default:
      return { label: 'Manuel', dot: 'bg-sky-500', icon: Pencil, iconCls: 'text-sky-400', badgeCls: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
  }
}

function platformGradient(p: AdsPlatform): string {
  if (p === 'facebook') return 'from-blue-500 to-blue-700';
  if (p === 'youtube') return 'from-red-500 to-red-700';
  return 'from-amber-400 via-rose-500 to-blue-500'; // google
}

function PlatformIcon({ platform, className }: { platform: AdsPlatform; className?: string }) {
  const Icon = platform === 'facebook' ? Facebook : platform === 'youtube' ? Youtube : Chrome;
  return <Icon className={className} aria-hidden="true" />;
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function AdsInboxPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<AdsItem[]>([]);
  const [stats, setStats] = useState<AdsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false); // mobile drawer
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [actionLoading, setActionLoading] = useState<null | 'regen' | 'save' | 'publish'>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchInbox = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await fetch('/api/ads/inbox?limit=100', { credentials: 'include' });
      if (r.status === 401) {
        window.location.href = '/login';
        return;
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erreur');
      setItems(d.items ?? []);
      setError(null);
    } catch (err) {
      if (!silent) setError((err as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch('/api/ads/stats', { credentials: 'include' });
      if (!r.ok) return;
      const d = await r.json();
      if (d.ok) setStats(d.stats);
    } catch {
      // silent
    }
  }, []);

  // Initial mount: auth check + fetch
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include' });
        if (!r.ok) {
          window.location.href = '/login';
          return;
        }
        const d = await r.json();
        if (!d.user) {
          window.location.href = '/login';
          return;
        }
        setAuthChecked(true);
        await Promise.all([fetchInbox(), fetchStats()]);
      } catch {
        window.location.href = '/login';
      }
    })();
  }, [fetchInbox, fetchStats]);

  // Polling: refetch inbox + stats every 10s
  useEffect(() => {
    if (!authChecked) return;
    pollRef.current = setInterval(() => {
      fetchInbox(true);
      fetchStats();
    }, 10_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [authChecked, fetchInbox, fetchStats]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const r = await fetch('/api/ads/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Échec seed');
      toast({ title: 'Données démo chargées', description: '4 éléments ajoutés à la boîte de réception.', variant: 'success' });
      await Promise.all([fetchInbox(), fetchStats()]);
    } catch (err) {
      toast({ title: 'Échec seed', description: (err as Error).message, variant: 'error' });
    } finally {
      setSeeding(false);
    }
  };

  // Filtered items based on tab + status
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (platformFilter !== 'all' && it.platform !== platformFilter) return false;
      if (statusFilter === 'pending' && it.aiResponseStatus !== 'pending') return false;
      if (statusFilter === 'responded' && it.aiResponseStatus !== 'responded' && it.aiResponseStatus !== 'manual') return false;
      return true;
    });
  }, [items, platformFilter, statusFilter]);

  const selectedItem = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);

  const handleSelect = useCallback(async (item: AdsItem) => {
    setSelectedId(item.id);
    setDetailOpen(true);
    setEditing(false);
    if (!item.isRead) {
      // Optimistic
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)));
      try {
        await fetch('/api/ads/respond', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ itemId: item.id, isRead: true }),
        });
        setStats((s) => (s ? { ...s, unreadCount: Math.max(0, s.unreadCount - 1) } : s));
      } catch {
        // ignore
      }
    }
  }, []);

  const updateSelectedItem = useCallback((updated: AdsItem) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const handleRegenerate = async () => {
    if (!selectedItem) return;
    setActionLoading('regen');
    try {
      const r = await fetch('/api/ads/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: selectedItem.id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Échec');
      if (d.item) updateSelectedItem(d.item as AdsItem);
      toast({ title: 'Réponse régénérée', description: 'L\'IA a produit une nouvelle réponse.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Échec régénération', description: (err as Error).message, variant: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedItem || !editedText.trim()) return;
    setActionLoading('save');
    try {
      const r = await fetch('/api/ads/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: selectedItem.id, manualResponse: editedText.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Échec');
      if (d.item) updateSelectedItem(d.item as AdsItem);
      setEditing(false);
      toast({ title: 'Réponse enregistrée', description: 'Votre réponse a remplacé la version IA.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Échec enregistrement', description: (err as Error).message, variant: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async () => {
    if (!selectedItem || !selectedItem.aiResponse) return;
    setActionLoading('publish');
    try {
      const r = await fetch('/api/ads/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: selectedItem.id, manualResponse: selectedItem.aiResponse, postToPlatform: true }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Échec');
      toast({
        title: 'Réponse publiée',
        description: `Réponse publiée sur ${platformLabel(selectedItem.platform)}.`,
        variant: 'success',
      });
    } catch (err) {
      toast({ title: 'Échec publication', description: (err as Error).message, variant: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStar = async () => {
    if (!selectedItem) return;
    const next = !selectedItem.isStarred;
    // Optimistic
    updateSelectedItem({ ...selectedItem, isStarred: next });
    try {
      const r = await fetch('/api/ads/respond', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: selectedItem.id, isStarred: next }),
      });
      if (!r.ok) throw new Error('Échec');
    } catch {
      // rollback
      updateSelectedItem({ ...selectedItem, isStarred: !next });
      toast({ title: 'Échec', description: 'Impossible de modifier l\'étoile', variant: 'error' });
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-gray-500">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  const statsCards = stats
    ? [
        { label: 'Total', value: stats.total, color: 'text-white', sub: `${stats.last24hCount} dernières 24h` },
        { label: 'Répondu', value: stats.respondedCount, color: 'text-green-400', sub: `${stats.byPlatform.facebook} FB · ${stats.byPlatform.google} G · ${stats.byPlatform.youtube} YT` },
        { label: 'En attente', value: stats.pendingCount, color: 'text-amber-400', sub: 'IA en cours ou à traiter' },
        { label: 'Non lus', value: stats.unreadCount, color: 'text-red-400', sub: 'À traiter en priorité' },
      ]
    : [];

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl animate-aurora" aria-hidden="true" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-red-500/8 blur-3xl animate-aurora delay-300" aria-hidden="true" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto">
        <ModuleHeader
          title="Boîte de réception Ads"
          description="Voyez l'IA répondre en temps réel aux commentaires et messages de vos publicités Facebook, Google et YouTube."
          icon={Inbox}
          gradient="from-orange-500 to-red-600"
          action={
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-green-500/30">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-semibold text-green-300 inline-flex items-center gap-1">
                <Radio className="w-3 h-3" aria-hidden="true" /> Live
              </span>
            </div>
          }
        />

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statsCards.map((card) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
              <p className={cn('text-3xl font-bold mt-1 font-mono', card.color)}>{card.value}</p>
              <p className="text-[11px] text-gray-600 mt-1 truncate">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {!loading && items.length === 0 && !error ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 border border-white/5">
            <EmptyState
              icon={Inbox}
              title="Boîte de réception vide"
              description="Aucun commentaire, message ou lead reçu pour le moment. Chargez des données de démonstration pour explorer l'interface, ou configurez vos webhooks dans l'admin."
              gradient="from-orange-500 to-red-600"
              action={{
                label: seeding ? 'Chargement...' : 'Charger des données de démo',
                onClick: handleSeed,
              }}
            />
          </motion.div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center gap-1 p-1 rounded-xl glass border border-white/5">
                {(['all', 'facebook', 'google', 'youtube'] as PlatformFilter[]).map((p) => {
                  const isActive = platformFilter === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatformFilter(p)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                        isActive ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5',
                      )}
                      aria-pressed={isActive}
                    >
                      {p === 'all' ? 'Tous' : p === 'facebook' ? <><Facebook className="w-3.5 h-3.5" aria-hidden="true" /> Facebook</> : p === 'google' ? <><Chrome className="w-3.5 h-3.5" aria-hidden="true" /> Google</> : <><Youtube className="w-3.5 h-3.5" aria-hidden="true" /> YouTube</>}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl glass border border-white/5">
                {(['all', 'pending', 'responded'] as StatusFilter[]).map((s) => {
                  const isActive = statusFilter === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                        isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5',
                      )}
                      aria-pressed={isActive}
                    >
                      {s === 'all' ? 'Tous' : s === 'pending' ? 'En attente' : 'Répondu'}
                    </button>
                  );
                })}
              </div>

              <div className="ml-auto text-xs text-gray-500">
                {filteredItems.length} élément{filteredItems.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4">
              {/* Inbox list */}
              <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-white/5">
                  <p className="text-sm font-semibold">Messages reçus</p>
                  <button
                    type="button"
                    onClick={() => { fetchInbox(); fetchStats(); }}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
                    aria-label="Rafraîchir"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} aria-hidden="true" />
                    <span className="hidden sm:inline">Rafraîchir</span>
                  </button>
                </div>
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500 inline-flex items-center justify-center gap-2 w-full">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Chargement...
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      Aucun élément pour ces filtres.
                    </div>
                  ) : (
                    <ul className="divide-y divide-white/5">
                      {filteredItems.map((item) => {
                        const sInfo = statusInfo(item.aiResponseStatus);
                        const sStyle = sentimentStyle(item.sentiment);
                        const TypeIcon = typeIcon(item.type);
                        const isSel = item.id === selectedId;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => handleSelect(item)}
                              className={cn(
                                'w-full text-left p-3 flex items-start gap-3 transition-colors hover:bg-white/5',
                                isSel && 'bg-white/5',
                              )}
                              aria-current={isSel ? 'true' : undefined}
                            >
                              {/* Platform icon */}
                              <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', platformGradient(item.platform))}>
                                <PlatformIcon platform={item.platform} className="w-4 h-4 text-white" />
                              </div>

                              {/* Body */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold truncate">{item.authorName}</p>
                                  <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border', sStyle.className)}>
                                    {sStyle.label}
                                  </span>
                                  {!item.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" aria-label="Non lu" />
                                  )}
                                  {item.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" aria-hidden="true" />}
                                </div>
                                <p className="text-xs text-gray-400 truncate mt-0.5">{item.message}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium', sInfo.iconCls)}>
                                    <sInfo.icon className="w-3 h-3" aria-hidden="true" />
                                    {sInfo.label}
                                  </span>
                                  <span className="text-[10px] text-gray-600 inline-flex items-center gap-0.5">
                                    <TypeIcon className="w-2.5 h-2.5" aria-hidden="true" />
                                    {typeLabel(item.type)}
                                  </span>
                                  <span className="text-[10px] text-gray-600">· {timeAgo(item.receivedAt)}</span>
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Detail panel — desktop */}
              <div className="hidden lg:block">
                {selectedItem ? (
                  <DetailPanel
                    item={selectedItem}
                    onClose={() => { setSelectedId(null); setEditing(false); }}
                    editing={editing}
                    editedText={editedText}
                    setEditedText={setEditedText}
                    setEditing={(v) => { setEditing(v); if (v) setEditedText(selectedItem.aiResponse ?? ''); }}
                    actionLoading={actionLoading}
                    onRegenerate={handleRegenerate}
                    onSaveEdit={handleSaveEdit}
                    onPublish={handlePublish}
                    onToggleStar={handleToggleStar}
                  />
                ) : (
                  <div className="glass rounded-2xl border border-white/5 p-12 text-center sticky top-4">
                    <Inbox className="w-10 h-10 text-gray-600 mx-auto mb-3" aria-hidden="true" />
                    <p className="text-sm text-gray-500">Sélectionnez un élément pour voir le détail</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile drawer / modal */}
      <AnimatePresence>
        {detailOpen && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end"
            onClick={() => setDetailOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-h-[90vh] overflow-y-auto custom-scrollbar rounded-t-3xl bg-[#0a0a0f] border-t border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-[#0a0a0f]/95 backdrop-blur p-3 border-b border-white/5 flex items-center justify-between z-10">
                <p className="text-sm font-semibold">Détail</p>
                <button
                  type="button"
                  onClick={() => setDetailOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="p-4">
                <DetailPanel
                  item={selectedItem}
                  onClose={() => setDetailOpen(false)}
                  editing={editing}
                  editedText={editedText}
                  setEditedText={setEditedText}
                  setEditing={(v) => { setEditing(v); if (v) setEditedText(selectedItem.aiResponse ?? ''); }}
                  actionLoading={actionLoading}
                  onRegenerate={handleRegenerate}
                  onSaveEdit={handleSaveEdit}
                  onPublish={handlePublish}
                  onToggleStar={handleToggleStar}
                  isMobile
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────
function DetailPanel({
  item, onClose, editing, editedText, setEditedText, setEditing,
  actionLoading, onRegenerate, onSaveEdit, onPublish, onToggleStar, isMobile,
}: {
  item: AdsItem;
  onClose: () => void;
  editing: boolean;
  editedText: string;
  setEditedText: (v: string) => void;
  setEditing: (v: boolean) => void;
  actionLoading: null | 'regen' | 'save' | 'publish';
  onRegenerate: () => void;
  onSaveEdit: () => void;
  onPublish: () => void;
  onToggleStar: () => void;
  isMobile?: boolean;
}) {
  const sInfo = statusInfo(item.aiResponseStatus);
  const TypeIcon = typeIcon(item.type);

  return (
    <div className={cn('glass rounded-2xl border border-white/5', !isMobile && 'sticky top-4 overflow-hidden')}>
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-gradient-to-r text-white', platformGradient(item.platform))}>
              <PlatformIcon platform={item.platform} className="w-3 h-3" />
              {platformLabel(item.platform)}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold uppercase bg-white/5 text-gray-300 border border-white/10">
              <TypeIcon className="w-3 h-3" aria-hidden="true" />
              {typeLabel(item.type)}
            </span>
            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase border', sInfo.badgeCls)}>
              <sInfo.icon className="w-3 h-3" aria-hidden="true" />
              {sInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleStar}
              className={cn('p-1.5 rounded-lg hover:bg-white/10', item.isStarred ? 'text-amber-400' : 'text-gray-500')}
              aria-label={item.isStarred ? 'Retirer l\'étoile' : 'Étoiler'}
              aria-pressed={item.isStarred}
            >
              <Star className={cn('w-4 h-4', item.isStarred && 'fill-amber-400')} aria-hidden="true" />
            </button>
            {!isMobile && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500"
                aria-label="Fermer le détail"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white', platformGradient(item.platform))}>
            {initials(item.leadName || item.authorName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{item.leadName || item.authorName}</p>
            <p className="text-xs text-gray-500">Reçu {timeAgo(item.receivedAt)}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
        {/* Post caption */}
        {item.postCaption && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Post / Annonce</p>
            <p className="text-sm text-gray-300">{item.postCaption}</p>
            {item.postUrl && (
              <a
                href={item.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-orange-400 hover:text-orange-300"
              >
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                Voir le post
              </a>
            )}
          </div>
        )}

        {/* Lead fields highlighted */}
        {item.type === 'lead' && (item.leadEmail || item.leadPhone || item.leadName) && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
            <p className="text-[10px] uppercase tracking-wide text-amber-400 mb-2 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" aria-hidden="true" /> Lead capturé
            </p>
            <div className="space-y-1.5 text-sm">
              {item.leadName && (
                <p className="inline-flex items-center gap-2 text-gray-200">
                  <User className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                  {item.leadName}
                </p>
              )}
              {item.leadEmail && (
                <p className="inline-flex items-center gap-2 text-gray-200">
                  <Mail className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                  <a href={`mailto:${item.leadEmail}`} className="hover:text-white">{item.leadEmail}</a>
                </p>
              )}
              {item.leadPhone && (
                <p className="inline-flex items-center gap-2 text-gray-200">
                  <Phone className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                  <a href={`tel:${item.leadPhone}`} className="hover:text-white">{item.leadPhone}</a>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Original message bubble */}
        <div className="flex gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
            {initials(item.authorName)}
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 mb-1">{item.authorName}</p>
            <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/5 p-3">
              <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{item.message}</p>
            </div>
          </div>
        </div>

        {/* AI response bubble */}
        {(item.aiResponse !== null || editing) && (
          <div className="flex gap-2 flex-col items-end">
            <div className="w-full max-w-[85%]">
              <div className="flex items-center justify-end gap-2 mb-1">
                <p className="text-[10px] text-gray-500 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-400" aria-hidden="true" />
                  Réponse IA
                  {item.aiRespondedAt && <span> · {timeAgo(item.aiRespondedAt)}</span>}
                </p>
              </div>
              {editing ? (
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl rounded-tr-sm bg-gradient-to-br from-orange-500/20 to-amber-600/20 border border-orange-500/40 p-3 text-sm text-white outline-none resize-y"
                  placeholder="Saisissez votre réponse..."
                  aria-label="Modifier la réponse"
                />
              ) : (
                <div className="rounded-2xl rounded-tr-sm bg-gradient-to-br from-orange-500/20 to-amber-600/20 border border-orange-500/40 p-3">
                  <p className="text-sm text-white whitespace-pre-wrap break-words">{item.aiResponse || <span className="text-gray-500 italic">(vide)</span>}</p>
                </div>
              )}
              {/* Provider/model + status */}
              {!editing && (item.aiProvider || item.aiModel) && (
                <p className="text-[10px] text-gray-600 mt-1 text-right">
                  {item.aiProvider && <span className="capitalize">{item.aiProvider}</span>}
                  {item.aiProvider && item.aiModel && <span> · </span>}
                  {item.aiModel && <span className="font-mono">{item.aiModel}</span>}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pending state */}
        {item.aiResponseStatus === 'pending' && !editing && (
          <div className="flex items-center justify-center gap-2 text-xs text-amber-400 py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            L'IA prépare une réponse...
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-white/5 flex flex-wrap gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={actionLoading === 'save' || !editedText.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            >
              {actionLoading === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Check className="w-3.5 h-3.5" aria-hidden="true" />}
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold glass border border-white/10 hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Annuler
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onRegenerate}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold glass border border-white/10 hover:bg-white/10 disabled:opacity-50"
            >
              {actionLoading === 'regen' ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
              Régénérer
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold glass border border-white/10 hover:bg-white/10 disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              Modifier
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={actionLoading !== null || !item.aiResponse}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            >
              {actionLoading === 'publish' ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Send className="w-3.5 h-3.5" aria-hidden="true" />}
              Publier
            </button>
          </>
        )}
      </div>
    </div>
  );
}
