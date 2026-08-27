// AfriLaunch AI — Création de contenu (génération IA réelle)
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenSquare, Sparkles, Loader2, Copy, RefreshCw,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

interface FormatOption {
  id: string;
  label: string;
}

const FORMATS: FormatOption[] = [
  { id: 'instagram-post', label: 'Post Instagram' },
  { id: 'instagram-story', label: 'Story Instagram' },
  { id: 'instagram-reel', label: 'Reel Instagram (script)' },
  { id: 'tiktok-video', label: 'Vidéo TikTok (script)' },
  { id: 'tiktok-caption', label: 'Caption TikTok' },
  { id: 'facebook-post', label: 'Post Facebook' },
  { id: 'twitter-thread', label: 'Thread Twitter/X' },
  { id: 'linkedin-post', label: 'Post LinkedIn' },
  { id: 'youtube-script', label: 'Script YouTube' },
  { id: 'youtube-description', label: 'Description YouTube' },
  { id: 'flyer', label: 'Flyer' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'email-promo', label: 'Email promo' },
  { id: 'blog-post', label: 'Article de blog' },
  { id: 'ad-copy', label: 'Texte publicitaire' },
  { id: 'whatsapp-broadcast', label: 'Broadcast WhatsApp' },
];

const TONES = ['Amical', 'Professionnel', 'Décontracté', 'Commercial'] as const;

function formatCharCount(n: number): string {
  // e.g. 1247 → "1 247 caractères" (fr-FR uses narrow no-break space, but regular space is fine for display)
  return `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} caractères`;
}

export default function ContentPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [format, setFormat] = useState<string>('instagram-post');
  const [topic, setTopic] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState<string>('Amical');
  const [batch, setBatch] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[] | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  const creditCost = batch ? 25 : 5;

  async function handleGenerate() {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Connectez-vous pour générer', variant: 'warning' });
      return;
    }
    setGenerating(true);
    setResults(null);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'content',
          format,
          topic,
          businessName,
          industry,
          audience,
          tone,
          batch,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.insufficientCredits) {
          toast({
            title: 'Crédits insuffisants',
            description: `La génération coûte ${creditCost} crédits. Rechargez votre compte.`,
            variant: 'error',
          });
        } else {
          toast({ title: 'Échec', description: data.error, variant: 'error' });
        }
        setGenerating(false);
        return;
      }
      const pieces = batch
        ? data.content.split('---VARIANTE---').map((s: string) => s.trim()).filter(Boolean)
        : [data.content.trim()];
      setResults(pieces);
      if (typeof data.creditsRemaining === 'number') setCreditsRemaining(data.creditsRemaining);
      toast({
        title: `${pieces.length} contenu(s) généré(s) ! ✍️`,
        description: `${creditCost} crédits débités`,
        variant: 'success',
      });
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setGenerating(false);
    }
  }

  function copyContent(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: 'Contenu copié', variant: 'success' });
  }

  const generateLabel = batch
    ? `Générer 3 variantes (25 crédits)`
    : `Générer (5 crédits)`;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-pink-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-rose-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Création de contenu"
          description="Générez posts, reels, flyers et newsletters avec l'IA. 50+ formats pré-configurés pour chaque réseau social."
          icon={PenSquare}
          gradient="from-pink-500 to-rose-600"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Form (left, sticky) ───────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="card-premium sticky top-6">
              <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" aria-hidden="true" />
                Configuration
              </h2>

              <div className="space-y-4">
                {/* Format selector */}
                <div>
                  <label htmlFor="content-format" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Format
                  </label>
                  <select
                    id="content-format"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-pink-500/40 outline-none text-sm bg-[#0a0a0f]"
                  >
                    {FORMATS.map((f) => (
                      <option key={f.id} value={f.id} className="bg-[#0a0a0f]">{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Topic */}
                <div>
                  <label htmlFor="content-topic" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Sujet / Produit
                  </label>
                  <textarea
                    id="content-topic"
                    rows={2}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: Lancement de ma nouvelle collection wax premium"
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-pink-500/40 outline-none text-sm resize-none"
                  />
                </div>

                {/* Business name */}
                <div>
                  <label htmlFor="content-business-name" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Nom du business
                  </label>
                  <input
                    id="content-business-name"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex: Teranga Mode"
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-pink-500/40 outline-none text-sm"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label htmlFor="content-industry" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Industrie
                  </label>
                  <input
                    id="content-industry"
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Ex: Mode, Restauration, Tech..."
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-pink-500/40 outline-none text-sm"
                  />
                </div>

                {/* Audience */}
                <div>
                  <label htmlFor="content-audience" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Audience cible
                  </label>
                  <input
                    id="content-audience"
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="entrepreneurs africains"
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-pink-500/40 outline-none text-sm"
                  />
                </div>

                {/* Tone */}
                <div>
                  <label htmlFor="content-tone" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Ton
                  </label>
                  <select
                    id="content-tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-pink-500/40 outline-none text-sm bg-[#0a0a0f]"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t} className="bg-[#0a0a0f]">{t}</option>
                    ))}
                  </select>
                </div>

                {/* Batch toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={batch}
                  onClick={() => setBatch((v) => !v)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors text-left',
                    batch ? 'border-pink-500/60 bg-pink-500/10' : 'border-white/5 glass hover:bg-white/5',
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold">Générer 3 variantes</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">25 crédits au lieu de 5</p>
                  </div>
                  <span
                    className={cn(
                      'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors',
                      batch ? 'bg-pink-500' : 'bg-white/15',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                        batch ? 'translate-x-5' : 'translate-x-0',
                      )}
                    />
                  </span>
                </button>

                {/* Generate button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-pink-500 to-rose-600 hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" aria-hidden="true" /> {generateLabel}
                    </>
                  )}
                </button>

                {!user && (
                  <p className="text-xs text-amber-400 text-center">Connectez-vous pour générer</p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Results (right) ───────────────────────────────────── */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Loading state */}
              {generating && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card-premium flex flex-col items-center justify-center py-20"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" aria-hidden="true" />
                  <p className="text-sm text-gray-400">L'IA crée votre contenu...</p>
                  <p className="text-xs text-gray-600 mt-2">
                    {batch ? '3 variantes en cours de génération' : `Format: ${FORMATS.find((f) => f.id === format)?.label}`}
                  </p>
                </motion.div>
              )}

              {/* Empty state */}
              {!generating && !results && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card-premium"
                >
                  <EmptyState
                    icon={PenSquare}
                    title="Aucun contenu généré"
                    description="Configurez le format, le sujet et le ton à gauche, puis cliquez sur « Générer ». L'IA produit un contenu adapté au marché africain en quelques secondes."
                    gradient="from-pink-500 to-rose-600"
                  />
                </motion.div>
              )}

              {/* Results */}
              {!generating && results && results.length > 0 && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {results.map((piece, i) => (
                    <div key={i} className="card-premium">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {batch && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300">
                              Variante {i + 1}/{results.length}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-500">{formatCharCount(piece.length)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyContent(piece)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copier
                        </button>
                      </div>
                      <div
                        className={cn(
                          'glass rounded-xl p-4 border border-white/5 text-sm text-gray-200 leading-relaxed',
                          !batch && 'min-h-[280px]',
                        )}
                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                      >
                        {piece}
                      </div>
                    </div>
                  ))}

                  {/* Footer: credits + regenerate */}
                  <div className="card-premium py-3 px-4 flex flex-wrap items-center gap-3">
                    <span className="text-xs text-gray-400">
                      Crédits restants&nbsp;: <strong className="text-white">{creditsRemaining ?? '—'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Régénérer
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
