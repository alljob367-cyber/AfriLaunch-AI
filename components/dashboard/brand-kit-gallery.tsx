// AfriLaunch AI — Brand Kit Gallery component
// Shows the user's brand kits (logo + banners + favicon) with live progress
// and download/share actions. Used in /dashboard/identity.
//
// Client-side cache: when a user downloads an asset, we store the dataUrl in
// localStorage so re-downloading (or viewing offline) doesn't require a new
// API call. Cache key: `afrilaunch.kit-asset.<kitId>.<assetType>`.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Image as ImageIcon, Loader2, Check, AlertCircle, Download, Share2,
  Trash2, RefreshCw, Sparkles, Eye,
} from 'lucide-react';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

interface BrandAsset {
  type: string;
  status: 'pending' | 'generating' | 'done' | 'failed';
  prompt?: string;
  dataUrl?: string;
  error?: string;
}

interface BrandKit {
  id: string;
  businessName: string;
  industry: string;
  country: string;
  style: string;
  identity: any;
  assets: BrandAsset[];
  status: string;
  progress: { done: number; total: number; percent: number };
  createdAt: number;
  updatedAt: number;
}

const ASSET_LABELS: Record<string, { label: string; ratio: string }> = {
  logo: { label: 'Logo (clair)', ratio: 'aspect-square' },
  logo_dark: { label: 'Logo (sombre)', ratio: 'aspect-square' },
  banner_facebook: { label: 'Bannière Facebook', ratio: 'aspect-[2/1]' },
  banner_instagram: { label: 'Post Instagram', ratio: 'aspect-square' },
  banner_linkedin: { label: 'Bannière LinkedIn', ratio: 'aspect-[2/1]' },
  banner_youtube: { label: 'Bannière YouTube', ratio: 'aspect-[2/1]' },
  favicon: { label: 'Favicon', ratio: 'aspect-square' },
};

export function BrandKitGallery() {
  const { toast } = useToast();
  const { user, refresh } = useAuth();
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [activeKit, setActiveKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch list (lightweight, no images)
  const fetchKits = useCallback(async () => {
    try {
      const res = await fetch('/api/brand-kit/list', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        setKits(data.kits);
        // Auto-select the most recent kit if any
        if (data.kits.length > 0 && !activeKit) {
          // Will fetch full kit with images below
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [activeKit]);

  // Fetch full kit with images (for the selected one)
  const fetchFullKit = useCallback(async (kitId: string) => {
    try {
      const res = await fetch(`/api/brand-kit/${kitId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        setActiveKit(data.kit);
        // Also update the lightweight list entry
        setKits((prev) => prev.map((k) => k.id === kitId ? { ...k, ...data.kit, progress: data.kit.progress } : k));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchKits();
  }, [fetchKits]);

  // Auto-poll when there's a running kit
  useEffect(() => {
    const hasRunning = kits.some((k) => k.status === 'running' || k.status === 'pending');
    if (hasRunning && !pollRef.current) {
      pollRef.current = setInterval(() => {
        fetchKits();
        if (activeKit && (activeKit.status === 'running' || activeKit.status === 'pending')) {
          fetchFullKit(activeKit.id);
        }
      }, 4000);
    } else if (!hasRunning && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [kits, activeKit, fetchKits, fetchFullKit]);

  // Auto-select first kit (or most recent running one) on first load
  useEffect(() => {
    if (!loading && kits.length > 0 && !activeKit) {
      const running = kits.find((k) => k.status === 'running' || k.status === 'pending');
      const target = running || kits[0];
      fetchFullKit(target.id);
    }
  }, [loading, kits, activeKit, fetchFullKit]);

  async function handleGenerate() {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Connectez-vous pour générer', variant: 'warning' });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/brand-kit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}), // pre-fills from organization
      });
      const data = await res.json();
      if (data.ok) {
        toast({
          title: 'Kit créé ! 🎨',
          description: `${data.creditsUsed} crédits débités. Génération des images en cours...`,
          variant: 'success',
        });
        try { refresh(); } catch { /* ignore */ }
        await fetchKits();

        // Auto-select the new kit and start generating assets
        if (data.kitId) {
          await fetchFullKit(data.kitId);
          // Generate assets sequentially (client-driven, avoids Vercel timeout)
          generateAssetsSequentially(data.kitId);
        }
      } else if (data.paymentRequired) {
        toast({
          title: 'Abonnement requis 🔒',
          description: 'Souscrivez un plan pour générer votre kit de marque.',
          variant: 'warning',
        });
      } else if (data.insufficientCredits) {
        toast({
          title: 'Crédits insuffisants',
          description: data.error,
          variant: 'error',
        });
      } else if (data.quotaExceeded) {
        toast({
          title: 'Quota mensuel atteint',
          description: data.error,
          variant: 'warning',
        });
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setGenerating(false);
    }
  }

  // Generate assets one by one (client-driven, avoids Vercel background timeout)
  async function generateAssetsSequentially(kitId: string) {
    const assetTypes = ['logo', 'logo_dark', 'banner_facebook', 'banner_instagram', 'banner_linkedin', 'banner_youtube', 'favicon'];
    for (const assetType of assetTypes) {
      try {
        const res = await fetch(`/api/brand-kit/${kitId}/generate-asset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ assetType }),
        });
        const data = await res.json();
        if (data.ok) {
          // Refresh the kit to show the new image
          await fetchFullKit(kitId);
        } else {
          console.error(`Asset ${assetType} failed:`, data.error);
        }
      } catch (err) {
        console.error(`Asset ${assetType} error:`, err);
      }
    }
    // Final refresh
    await fetchKits();
  }

  async function handleDelete(kitId: string) {
    if (!confirm('Supprimer ce kit de marque ? Les images seront perdues.')) return;
    setDeletingId(kitId);
    try {
      const res = await fetch(`/api/brand-kit/${kitId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok) {
        if (activeKit?.id === kitId) setActiveKit(null);
        clearCachedKit(kitId); // clear client-side cache
        await fetchKits();
        toast({ title: 'Kit supprimé', variant: 'warning' });
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' });
    } finally {
      setDeletingId(null);
    }
  }

  // ── Client-side cache (localStorage) ────────────────────────────────
  // Stores downloaded asset dataUrls so re-downloading or offline viewing
  // doesn't require a new API call. Cache is keyed by kitId + assetType
  // and expires after 30 days (matches the server-side kit retention).
  const CACHE_PREFIX = 'afrilaunch.kit-asset.';
  const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  function getCachedAsset(kitId: string, assetType: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const key = CACHE_PREFIX + kitId + '.' + assetType;
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.savedAt > CACHE_TTL_MS) {
        window.localStorage.removeItem(key);
        return null;
      }
      return parsed.dataUrl;
    } catch { return null; }
  }

  function setCachedAsset(kitId: string, assetType: string, dataUrl: string) {
    if (typeof window === 'undefined') return;
    try {
      const key = CACHE_PREFIX + kitId + '.' + assetType;
      // localStorage has a ~5MB limit per origin — store only if the image
      // is small enough (dataUrl < 2MB to be safe)
      if (dataUrl.length > 2 * 1024 * 1024) return;
      window.localStorage.setItem(key, JSON.stringify({
        dataUrl,
        savedAt: Date.now(),
      }));
    } catch { /* quota exceeded — ignore */ }
  }

  function clearCachedKit(kitId: string) {
    if (typeof window === 'undefined') return;
    try {
      const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(CACHE_PREFIX + kitId + '.'));
      keys.forEach((k) => window.localStorage.removeItem(k));
    } catch { /* ignore */ }
  }

  function downloadAsset(asset: BrandAsset, businessName: string, kitId?: string) {
    if (!asset.dataUrl) {
      // Try client-side cache fallback
      if (kitId) {
        const cached = getCachedAsset(kitId, asset.type);
        if (cached) {
          triggerDownload(cached, asset.type, businessName);
          toast({ title: 'Téléchargement (cache local)', description: `${asset.type} restauré depuis le cache hors-ligne.`, variant: 'success' });
          return;
        }
      }
      return;
    }
    // Save to client cache for offline reuse
    if (kitId) setCachedAsset(kitId, asset.type, asset.dataUrl);
    triggerDownload(asset.dataUrl, asset.type, businessName);
  }

  function triggerDownload(dataUrl: string, assetType: string, businessName: string) {
    const safeName = (businessName || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${safeName}-${assetType}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'Téléchargement', description: `${safeName}-${assetType}.png`, variant: 'success' });
  }

  async function shareAsset(asset: BrandAsset, businessName: string) {
    if (!asset.dataUrl) return;
    // Try Web Share API with files (mobile)
    if (typeof navigator !== 'undefined' && (navigator as any).canShare) {
      try {
        const blob = await (await fetch(asset.dataUrl)).blob();
        const file = new File([blob], `${businessName}-${asset.type}.png`, { type: 'image/png' });
        if ((navigator as any).canShare({ files: [file] })) {
          await (navigator as any).share({ files: [file], title: businessName });
          return;
        }
      } catch { /* user cancelled — fall through */ }
    }
    // Fallback: download
    downloadAsset(asset, businessName, activeKit?.id);
  }

  if (loading) {
    return (
      <div className="card-premium p-6 mb-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Header with generate button */}
      <div className="card-premium p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-bold text-base flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-violet-400" aria-hidden="true" />
              Kit de marque visuel
            </h2>
            <p className="text-xs text-gray-500">
              Génère un kit complet : logo, bannières Facebook/Instagram/LinkedIn/YouTube, favicon.
              Coût : 15 crédits. Durée : 2-3 min.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-60 disabled:hover:scale-100"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Sparkles className="w-4 h-4" aria-hidden="true" />}
            {generating ? 'Démarrage…' : 'Générer un kit visuel'}
          </button>
        </div>
      </div>

      {/* List of kits (sidebar) */}
      {kits.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {kits.map((k) => {
            const isActive = activeKit?.id === k.id;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => fetchFullKit(k.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border transition-all',
                  isActive
                    ? 'bg-violet-500/20 border-violet-500/40 text-white'
                    : 'glass border-white/5 text-gray-400 hover:text-white',
                )}
              >
                <span className="block truncate max-w-[160px]">{k.businessName}</span>
                <span className="text-[10px] text-gray-500">
                  {k.progress.done}/{k.progress.total} livrables · {k.progress.percent}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active kit display */}
      <AnimatePresence mode="wait">
        {activeKit && (
          <motion.div
            key={activeKit.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card-premium p-5 space-y-5"
          >
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold">{activeKit.businessName}</p>
                  <p className="text-[11px] text-gray-500">
                    {activeKit.industry} · {activeKit.country} · {activeKit.style}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold gradient-text">
                    {activeKit.progress.done}/{activeKit.progress.total}
                  </p>
                  <p className="text-[10px] text-gray-500">livrables prêts</p>
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${activeKit.progress.percent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {activeKit.status === 'done' && '✅ Kit complet — tous les livrables sont prêts.'}
                {activeKit.status === 'running' && `⏳ Génération en cours… ${activeKit.progress.done}/${activeKit.progress.total} prêts.`}
                {activeKit.status === 'pending' && '⏳ En attente de démarrage…'}
                {activeKit.status === 'failed' && '❌ Échec de la génération.'}
              </p>
            </div>

            {/* Identity summary (if generated) */}
            {activeKit.identity?.brandName && (
              <div className="glass rounded-xl p-3 border border-white/5">
                <p className="text-xs font-bold mb-1">{activeKit.identity.brandName}</p>
                {activeKit.identity.tagline && (
                  <p className="text-[11px] text-gray-400 italic mb-2">« {activeKit.identity.tagline} »</p>
                )}
                {activeKit.identity.palette && (
                  <div className="flex items-center gap-1.5">
                    {['primary', 'secondary', 'accent', 'background', 'text'].map((k) => {
                      const color = (activeKit.identity.palette as any)[k];
                      if (!color) return null;
                      return (
                        <div
                          key={k}
                          className="w-6 h-6 rounded-md border border-white/10"
                          style={{ backgroundColor: color }}
                          title={`${k}: ${color}`}
                        />
                      );
                    })}
                  </div>
                )}
                {activeKit.identity.socialKit?.instagram?.bio && (
                  <p className="text-[11px] text-gray-500 mt-2">
                    <strong>Bio IG:</strong> {activeKit.identity.socialKit.instagram.bio}
                  </p>
                )}
              </div>
            )}

            {/* Assets grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {activeKit.assets.map((asset) => {
                const meta = ASSET_LABELS[asset.type] || { label: asset.type, ratio: 'aspect-square' };
                return (
                  <div
                    key={asset.type}
                    className="glass rounded-xl border border-white/5 overflow-hidden group"
                  >
                    <div className={cn('relative bg-white/5', meta.ratio)}>
                      {asset.status === 'done' && asset.dataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.dataUrl}
                          alt={meta.label}
                          className="w-full h-full object-contain"
                        />
                      ) : asset.status === 'generating' ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-violet-400" aria-hidden="true" />
                        </div>
                      ) : asset.status === 'failed' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                          <AlertCircle className="w-4 h-4 text-red-400 mb-1" aria-hidden="true" />
                          <span className="text-[9px] text-red-400 text-center">Échec</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                        </div>
                      )}

                      {/* Hover actions when done */}
                      {asset.status === 'done' && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => downloadAsset(asset, activeKit.businessName, activeKit.id)}
                            aria-label="Télécharger"
                            className="p-1.5 rounded-lg glass border border-white/20 hover:bg-white/20"
                          >
                            <Download className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => shareAsset(asset, activeKit.businessName)}
                            aria-label="Partager"
                            className="p-1.5 rounded-lg glass border border-white/20 hover:bg-white/20"
                          >
                            <Share2 className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-semibold truncate">{meta.label}</p>
                      <p className="text-[9px] text-gray-500">
                        {asset.status === 'done' && <span className="text-emerald-400">✓ Prêt</span>}
                        {asset.status === 'generating' && 'Génération…'}
                        {asset.status === 'pending' && 'En attente'}
                        {asset.status === 'failed' && <span className="text-red-400">Échec</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bulk actions (only when kit is done) */}
            {activeKit.status === 'done' && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <p className="text-xs text-emerald-400 flex items-center gap-1.5 mr-auto">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Kit complet — téléchargez ou partagez chaque élément.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    activeKit.assets.filter((a) => a.status === 'done').forEach((a, i) => {
                      setTimeout(() => downloadAsset(a, activeKit.businessName), i * 300);
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:scale-[1.02] transition-transform"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  Tout télécharger
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(activeKit.id)}
                  disabled={deletingId === activeKit.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold glass border border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-60"
                >
                  {deletingId === activeKit.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
                  Supprimer
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {kits.length === 0 && !generating && (
        <div className="card-premium p-8 text-center">
          <ImageIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-gray-400 mb-1">Aucun kit visuel généré</p>
          <p className="text-xs text-gray-600 mb-4">
            Cliquez sur « Générer un kit visuel » pour créer logo + bannières + favicon.
          </p>
          {!user && (
            <p className="text-xs text-amber-400">
              <Link href="/login" className="underline">Connectez-vous</Link> pour générer.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
