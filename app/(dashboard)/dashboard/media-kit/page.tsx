// AfriLaunch AI — Media Kit module (kit réseaux sociaux + campagnes pub)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Share2, Sparkles, Loader2, Download, Check, AlertCircle,
  Image as ImageIcon, RefreshCw, Trash2, Type,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

interface MediaAsset {
  id: string;
  type: string;
  label: string;
  size: string;
  status: 'pending' | 'generating' | 'done' | 'failed';
  hasImage: boolean;
  dataUrl?: string;
  error?: string;
}

interface MediaKit {
  id: string;
  kitType: 'social' | 'ads';
  businessName: string;
  industry: string;
  style: string;
  copy?: {
    headlines: string[];
    taglines: string[];
    ctas: string[];
    adCopy?: string;
  };
  assets: MediaAsset[];
  status: string;
  createdAt: number;
}

const ASSET_RATIOS: Record<string, string> = {
  profile_pic: 'aspect-square',
  cover_facebook: 'aspect-[2/1]',
  story_instagram: 'aspect-[9/16]',
  post_template: 'aspect-square',
  banner_linkedin: 'aspect-[2/1]',
  ad_facebook: 'aspect-[2/1]',
  ad_instagram: 'aspect-square',
  ad_story: 'aspect-[9/16]',
  ad_display: 'aspect-[16/9]',
  ad_google: 'aspect-[2/1]',
};

export default function MediaKitPage() {
  const { toast } = useToast();
  const { user, refresh } = useAuth();
  const [kits, setKits] = useState<MediaKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchKits = useCallback(async () => {
    try {
      const res = await fetch('/api/media-kit/list', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setKits(data.kits);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKits();
    // Poll if there's a running kit
    const id = setInterval(() => {
      setKits((prev) => {
        if (prev.some((k) => k.status === 'running' || k.status === 'pending')) {
          fetchKits();
        }
        return prev;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [fetchKits]);

  async function handleGenerate(kitType: 'social' | 'ads') {
    setGenerating(true);
    try {
      const res = await fetch('/api/media-kit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: kitType }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({
          title: `Kit ${kitType === 'ads' ? 'publicitaire' : 'réseaux sociaux'} démarré ! 🎨`,
          description: `${data.creditsUsed} crédits débités. Suivez la progression ci-dessous.`,
          variant: 'success',
        });
        try { refresh(); } catch { /* ignore */ }
        await fetchKits();
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setGenerating(false);
    }
  }

  function downloadAsset(asset: MediaAsset, businessName: string) {
    if (!asset.dataUrl) return;
    const safeName = (businessName || 'media').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const a = document.createElement('a');
    a.href = asset.dataUrl;
    a.download = `${safeName}-${asset.type}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'Téléchargement', description: `${safeName}-${asset.type}.png`, variant: 'success' });
  }

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Kit Média"
          description="Générez des kits visuels complets pour vos réseaux sociaux et campagnes publicitaires. Logo, bannières, templates de posts, créatives pub — tout en un clic."
          icon={Megaphone}
          gradient="from-orange-500 to-amber-600"
        />

        {/* Generate buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.button
            type="button"
            onClick={() => handleGenerate('social')}
            disabled={generating}
            whileHover={{ y: -4 }}
            className="glass rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all text-left disabled:opacity-60"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg mb-3">
              <Share2 className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-base mb-1">Kit Réseaux Sociaux</h3>
            <p className="text-xs text-gray-500 mb-3">
              Photo de profil, cover Facebook, story Instagram, template de post, bannière LinkedIn
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-600">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Générer (25 crédits)
            </span>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => handleGenerate('ads')}
            disabled={generating}
            whileHover={{ y: -4 }}
            className="glass rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all text-left disabled:opacity-60"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg mb-3">
              <Megaphone className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-base mb-1">Kit Campagne Publicitaire</h3>
            <p className="text-xs text-gray-500 mb-3">
              Créative pub Facebook, pub Instagram, pub Story, bannière display, bannière Google Ads + copywriting
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-600">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Générer (25 crédits)
            </span>
          </motion.button>
        </div>

        {generating && (
          <div className="card-premium p-6 mb-6 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-orange-400" aria-hidden="true" />
            <p className="text-sm text-gray-400">Démarrage de la génération...</p>
          </div>
        )}

        {/* Kits list */}
        {kits.length === 0 && !generating ? (
          <div className="card-premium p-8 text-center">
            <ImageIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm text-gray-400 mb-1">Aucun kit média généré</p>
            <p className="text-xs text-gray-600">Choisissez un type de kit ci-dessus pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {kits.map((kit) => {
              const doneCount = kit.assets.filter((a) => a.status === 'done').length;
              const totalCount = kit.assets.length;
              const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
              return (
                <motion.div
                  key={kit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-premium p-5"
                >
                  {/* Kit header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        kit.kitType === 'ads' ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-emerald-600',
                      )}>
                        {kit.kitType === 'ads' ? <Megaphone className="w-5 h-5 text-white" /> : <Share2 className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          {kit.kitType === 'ads' ? 'Kit Publicitaire' : 'Kit Réseaux Sociaux'}
                        </p>
                        <p className="text-[11px] text-gray-500">{kit.businessName} · {kit.industry}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold gradient-text">{doneCount}/{totalCount}</p>
                      <p className="text-[10px] text-gray-500">livrables prêts</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                    <motion.div
                      className={cn(
                        'h-full',
                        kit.kitType === 'ads'
                          ? 'bg-gradient-to-r from-orange-500 to-red-600'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600',
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* AI copy (headlines, taglines, CTAs) */}
                  {kit.copy && (
                    <div className="glass rounded-xl p-3 border border-white/5 mb-4 space-y-3">
                      <p className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5" /> Copywriting IA
                      </p>
                      {kit.copy.headlines?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase mb-1">Headlines</p>
                          <div className="flex flex-wrap gap-1.5">
                            {kit.copy.headlines.map((h, i) => (
                              <span key={i} className="px-2 py-1 rounded-lg glass border border-white/10 text-[11px]">{h}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {kit.copy.ctas?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase mb-1">Call-to-action</p>
                          <div className="flex flex-wrap gap-1.5">
                            {kit.copy.ctas.map((c, i) => (
                              <span key={i} className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-300">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {kit.copy.adCopy && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase mb-1">Texte publicitaire</p>
                          <p className="text-xs text-gray-300 leading-relaxed">{kit.copy.adCopy}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assets grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {kit.assets.map((asset) => {
                      const ratio = ASSET_RATIOS[asset.type] || 'aspect-square';
                      return (
                        <div key={asset.id} className="glass rounded-xl border border-white/5 overflow-hidden group">
                          <div className={cn('relative bg-white/5', ratio)}>
                            {asset.status === 'done' && asset.dataUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={asset.dataUrl} alt={asset.label} className="w-full h-full object-contain" />
                            ) : asset.status === 'generating' ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
                              </div>
                            ) : asset.status === 'failed' ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                <AlertCircle className="w-4 h-4 text-red-400 mb-1" />
                                <span className="text-[9px] text-red-400">Échec</span>
                              </div>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                            {asset.status === 'done' && asset.dataUrl && (
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => downloadAsset(asset, kit.businessName)}
                                  className="p-2 rounded-lg glass border border-white/20 hover:bg-white/20"
                                  aria-label="Télécharger"
                                >
                                  <Download className="w-3.5 h-3.5 text-white" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-[10px] font-semibold truncate">{asset.label}</p>
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
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
