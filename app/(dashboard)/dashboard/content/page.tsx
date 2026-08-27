// AfriLaunch AI — Création de contenu (génération IA + images)
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenSquare, Sparkles, Loader2, Copy, RefreshCw, ImageIcon, Download,
  Send, Calendar,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

interface FormatOption { id: string; label: string; }

type SocialPlatform = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'whatsapp';

const PUBLISH_PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

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

// Formats that benefit from an image
const IMAGE_FORMATS = ['instagram-post', 'instagram-story', 'facebook-post', 'flyer', 'ad-copy'];

function formatCharCount(n: number): string {
  return `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} caractères`;
}

async function pollJob(jobId: string, onStatus?: (status: string, elapsed: number) => void): Promise<{ ok: boolean; content?: string; error?: string; provider?: string; model?: string }> {
  const maxAttempts = 100; // 100 × 3s = 5 min max
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const res = await fetch(`/api/ai/generate-async?jobId=${jobId}`, { credentials: 'include' });
      const data = await res.json();
      if (onStatus) onStatus(data.status, data.elapsed || 0);
      if (data.status === 'done' && data.result) {
        return { ok: true, content: data.result.content, provider: data.result.provider, model: data.result.model };
      }
      if (data.status === 'failed') {
        return { ok: false, error: data.error || 'Génération échouée' };
      }
      // Still pending or running → continue polling
    } catch { /* retry */ }
  }
  return { ok: false, error: 'Timeout: la génération prend trop de temps' };
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
  const [statusMsg, setStatusMsg] = useState('');
  const [results, setResults] = useState<string[] | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [orgLoaded, setOrgLoaded] = useState(false);

  // Image generation state
  const [generateImage, setGenerateImage] = useState(true);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  // Publish state
  const [showPublishMenu, setShowPublishMenu] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [showScheduleMenu, setShowScheduleMenu] = useState<number | null>(null);
  const [scheduledPlatform, setScheduledPlatform] = useState<SocialPlatform | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');

  useEffect(() => {
    fetch('/api/organization', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.organization) {
          const org = data.organization;
          if (org.name) setBusinessName(prev => prev || org.name);
          if (org.industry) setIndustry(prev => prev || org.industry);
          if (org.country) {
            const feminine = ['Côte d\'Ivoire', 'Guinée', 'Tunisie', 'Algérie', 'France'];
            const prep = org.country === 'Madagascar' ? 'à' : (feminine.includes(org.country) ? 'en' : 'au');
            setAudience(prev => prev || `entrepreneurs ${prep} ${org.country}`);
          }
        }
        setOrgLoaded(true);
      })
      .catch(() => setOrgLoaded(true));
  }, []);

  const creditCost = batch ? 3 : 1;
  const showImageOption = IMAGE_FORMATS.includes(format);

  async function handleGenerate() {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Connectez-vous pour générer', variant: 'warning' });
      return;
    }
    setGenerating(true);
    setResults(null);
    setGeneratedImageUrl(null);
    setStatusMsg('Démarrage de la génération...');
    try {
      const res = await fetch('/api/ai/generate-async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'content', format, topic, businessName, industry, audience, tone, batch }),
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.insufficientCredits) {
          toast({ title: 'Crédits insuffisants', description: `La génération coûte ${creditCost} crédits.`, variant: 'error' });
        } else if (data.dailyLimitReached) {
          toast({ title: 'Limite quotidienne atteinte', description: data.error, variant: 'error' });
        } else {
          toast({ title: 'Échec', description: data.error, variant: 'error' });
        }
        setGenerating(false);
        setStatusMsg('');
        return;
      }
      const creditsRemaining = data.creditsRemaining;
      // Poll the async job until done or failed
      const startTime = Date.now();
      const result = await pollJob(data.jobId, (_status, _elapsed) => {
        const seconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        setStatusMsg(`Génération en cours... (${seconds}s)`);
      });
      if (!result.ok) {
        toast({ title: 'Échec', description: result.error, variant: 'error' });
        setGenerating(false);
        setStatusMsg('');
        return;
      }
      const content = result.content || '';
      const pieces = batch
        ? content.split('---VARIANTE---').map((s: string) => s.trim()).filter(Boolean)
        : [content.trim()];
      setResults(pieces);
      if (typeof creditsRemaining === 'number') setCreditsRemaining(creditsRemaining);
      toast({ title: `${pieces.length} contenu(s) généré(s) ! ✍️`, description: `${creditCost} crédits débités`, variant: 'success' });

      // Generate image if applicable
      if (generateImage && showImageOption && !batch) {
        generateImageForContent(pieces[0]);
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setGenerating(false);
      setStatusMsg('');
    }
  }

  async function generateImageForContent(contentText: string) {
    setGeneratingImage(true);
    try {
      // Build a visual prompt from the content + business context
      const promptParts = [
        businessName || 'business',
        industry || '',
        topic || '',
      ].filter(Boolean).join(', ');
      // Use the AI to generate a short visual prompt
      const visualPromptRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'content',
          format: 'ad-copy',
          topic: `Génère une description visuelle courte (max 50 mots) pour une image de post réseaux sociaux: ${promptParts}. Décris la scène, les couleurs, le style.`,
          businessName,
          industry,
          tone: 'Commercial',
        }),
      });
      const visualData = await visualPromptRes.json();
      let visualPrompt = '';
      if (visualData.ok) {
        visualPrompt = visualData.content.trim().slice(0, 200);
      } else {
        visualPrompt = `${businessName} ${industry} ${topic} professional social media post`.slice(0, 200);
      }

      // Generate image via Pollinations.ai (free, no API key)
      const encodedPrompt = encodeURIComponent(visualPrompt);
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1080&seed=${seed}&nologo=true&model=flux`;
      setGeneratedImageUrl(imageUrl);
      toast({ title: 'Image générée ! 🖼️', description: 'Image visuelle créée pour votre post', variant: 'success' });
    } catch {
      toast({ title: 'Image non générée', description: 'Le texte a été généré avec succès.', variant: 'warning' });
    } finally {
      setGeneratingImage(false);
    }
  }

  function copyContent(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: 'Contenu copié', variant: 'success' });
  }

  function downloadImage() {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `${(businessName || 'content').toLowerCase().replace(/\s+/g, '-')}-image.jpg`;
    a.target = '_blank';
    a.click();
    toast({ title: 'Téléchargement de l\'image', variant: 'success' });
  }

  async function handlePublish(platform: SocialPlatform, piece: string) {
    setShowPublishMenu(null);
    setPublishing(true);
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platform, content: piece, imageUrl: generatedImageUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast({ title: 'Échec de publication', description: data.error || 'Erreur serveur', variant: 'error' });
        return;
      }
      toast({
        title: `Publié sur ${platformLabel(platform)} !`,
        description: data.message || 'Votre contenu est en ligne.',
        variant: 'success',
      });
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setPublishing(false);
    }
  }

  async function handleScheduleConfirm(piece: string) {
    if (!scheduledPlatform || !scheduledDate) {
      toast({ title: 'Champs requis', description: 'Sélectionnez une plateforme et une date.', variant: 'warning' });
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          platform: scheduledPlatform,
          content: piece,
          imageUrl: generatedImageUrl || undefined,
          scheduledAt: new Date(scheduledDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast({ title: 'Échec de la programmation', description: data.error || 'Erreur serveur', variant: 'error' });
        return;
      }
      toast({
        title: `Programmé sur ${platformLabel(scheduledPlatform)} !`,
        description: data.message || 'Publication programmée.',
        variant: 'success',
      });
      setShowScheduleMenu(null);
      setScheduledPlatform(null);
      setScheduledDate('');
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setPublishing(false);
    }
  }

  function platformLabel(id: SocialPlatform): string {
    return PUBLISH_PLATFORMS.find((p) => p.id === id)?.label ?? id;
  }

  const generateLabel = batch ? `Générer 3 variantes (3 crédits)` : `Générer (1 crédit)`;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-pink-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-rose-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Création de contenu"
          description="Générez posts, reels, flyers et newsletters avec l'IA + image visuelle. 50+ formats pour chaque réseau social."
          icon={PenSquare}
          gradient="from-pink-500 to-rose-600"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="card-premium sticky top-6">
              <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" aria-hidden="true" />
                Configuration
              </h2>

              <div className="space-y-4">
                {orgLoaded && (
                  <p className="text-[11px] text-gray-500">
                    💡 Pré-rempli depuis votre <Link href="/dashboard/organization" className="text-slate-400 hover:text-white underline">organisation</Link>
                  </p>
                )}

                <div>
                  <label htmlFor="content-format" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">Format</label>
                  <select id="content-format" value={format} onChange={(e) => setFormat(e.target.value)} className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-pink-500/40 outline-none text-sm bg-[#0a0a0f]">
                    {FORMATS.map((f) => <option key={f.id} value={f.id} className="bg-[#0a0a0f]">{f.label}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="content-topic" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">Sujet / Produit</label>
                  <textarea id="content-topic" rows={2} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: Lancement de ma nouvelle collection wax premium" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-pink-500/40 outline-none text-sm resize-none" />
                </div>

                <div>
                  <label htmlFor="content-business-name" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">Nom du business</label>
                  <input id="content-business-name" type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ex: Teranga Mode" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-pink-500/40 outline-none text-sm" />
                </div>

                <div>
                  <label htmlFor="content-industry" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">Industrie</label>
                  <input id="content-industry" type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ex: Mode, Restauration, Tech..." className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-pink-500/40 outline-none text-sm" />
                </div>

                <div>
                  <label htmlFor="content-audience" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">Audience cible</label>
                  <input id="content-audience" type="text" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="entrepreneurs africains" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-pink-500/40 outline-none text-sm" />
                </div>

                <div>
                  <label htmlFor="content-tone" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">Ton</label>
                  <select id="content-tone" value={tone} onChange={(e) => setTone(e.target.value)} className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-pink-500/40 outline-none text-sm bg-[#0a0a0f]">
                    {TONES.map((t) => <option key={t} value={t} className="bg-[#0a0a0f]">{t}</option>)}
                  </select>
                </div>

                {/* Image generation toggle */}
                {showImageOption && !batch && (
                  <button type="button" role="switch" aria-checked={generateImage} onClick={() => setGenerateImage((v) => !v)}
                    className={cn('w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors text-left', generateImage ? 'border-pink-500/60 bg-pink-500/10' : 'border-white/5 glass hover:bg-white/5')}>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-pink-400" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-semibold">Générer une image</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Image visuelle pour le post (gratuit)</p>
                      </div>
                    </div>
                    <span className={cn('relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors', generateImage ? 'bg-pink-500' : 'bg-white/15')}>
                      <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', generateImage ? 'translate-x-5' : 'translate-x-0')} />
                    </span>
                  </button>
                )}

                {/* Batch toggle */}
                <button type="button" role="switch" aria-checked={batch} onClick={() => setBatch((v) => !v)}
                  className={cn('w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors text-left', batch ? 'border-pink-500/60 bg-pink-500/10' : 'border-white/5 glass hover:bg-white/5')}>
                  <div>
                    <p className="text-sm font-semibold">Générer 3 variantes</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">3 crédits au lieu de 1</p>
                  </div>
                  <span className={cn('relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors', batch ? 'bg-pink-500' : 'bg-white/15')}>
                    <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', batch ? 'translate-x-5' : 'translate-x-0')} />
                  </span>
                </button>

                <button type="button" onClick={handleGenerate} disabled={generating}
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-pink-500 to-rose-600 hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Génération...</> : <><Sparkles className="w-4 h-4" aria-hidden="true" /> {generateLabel}</>}
                </button>

                {!user && <p className="text-xs text-amber-400 text-center">Connectez-vous pour générer</p>}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {generating && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="card-premium flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" aria-hidden="true" />
                  <p className="text-sm text-gray-400">{statusMsg || "L'IA crée votre contenu..."}</p>
                  <p className="text-xs text-gray-600 mt-2">{batch ? '3 variantes en cours' : `Format: ${FORMATS.find((f) => f.id === format)?.label}`}</p>
                </motion.div>
              )}

              {!generating && !results && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-premium">
                  <EmptyState icon={PenSquare} title="Aucun contenu généré"
                    description="Configurez le format, le sujet et le ton à gauche, puis cliquez sur « Générer ». L'IA produit un contenu adapté au marché africain + image visuelle."
                    gradient="from-pink-500 to-rose-600" />
                </motion.div>
              )}

              {!generating && results && results.length > 0 && (
                <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Generated image */}
                  {generatedImageUrl && (
                    <div className="card-premium">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-pink-400" aria-hidden="true" />
                          <span className="text-sm font-semibold">Image visuelle générée</span>
                        </div>
                        <button type="button" onClick={downloadImage}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors">
                          <Download className="w-3.5 h-3.5" aria-hidden="true" /> Télécharger
                        </button>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-white/5 bg-black/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={generatedImageUrl} alt="Image générée pour le contenu" className="w-full h-auto" />
                      </div>
                    </div>
                  )}

                  {/* Image loading */}
                  {generatingImage && (
                    <div className="card-premium flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-pink-500 mr-3" aria-hidden="true" />
                      <p className="text-sm text-gray-400">Génération de l'image visuelle...</p>
                    </div>
                  )}

                  {/* Text content */}
                  {results.map((piece, i) => (
                    <div key={i} className="card-premium">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {batch && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300">Variante {i + 1}/{results.length}</span>}
                          <span className="text-[11px] text-gray-500">{formatCharCount(piece.length)}</span>
                        </div>
                        <div className="flex items-center gap-2 relative">
                          <button type="button" onClick={() => copyContent(piece)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors">
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copier
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPublishMenu(showPublishMenu === i ? null : i);
                              setShowScheduleMenu(null);
                            }}
                            disabled={publishing}
                            aria-haspopup="menu"
                            aria-expanded={showPublishMenu === i}
                            aria-label={`Publier la variante ${i + 1}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 hover:scale-[1.02] text-xs font-semibold transition-transform disabled:opacity-60"
                          >
                            {publishing && showPublishMenu === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Send className="w-3.5 h-3.5" aria-hidden="true" />}
                            Publier
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowScheduleMenu(showScheduleMenu === i ? null : i);
                              setShowPublishMenu(null);
                            }}
                            disabled={publishing}
                            aria-haspopup="menu"
                            aria-expanded={showScheduleMenu === i}
                            aria-label={`Programmer la variante ${i + 1}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors disabled:opacity-60"
                          >
                            <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> Programmer
                          </button>

                          {/* Publish dropdown */}
                          {showPublishMenu === i && (
                            <div
                              role="menu"
                              className="absolute right-0 top-full mt-1 w-44 glass rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden"
                            >
                              <p className="px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500 border-b border-white/5">Publier sur</p>
                              {PUBLISH_PLATFORMS.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  role="menuitem"
                                  onClick={() => handlePublish(p.id, piece)}
                                  disabled={publishing}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-pink-500/15 hover:text-white transition-colors disabled:opacity-50"
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Schedule dropdown */}
                          {showScheduleMenu === i && (
                            <div
                              role="menu"
                              className="absolute right-0 top-full mt-1 w-72 glass rounded-xl border border-white/10 shadow-xl z-20 p-3 space-y-3"
                            >
                              <p className="text-[10px] uppercase tracking-wide text-gray-500">Programmer la publication</p>
                              <div>
                                <label htmlFor={`sched-platform-${i}`} className="text-[11px] text-gray-400 block mb-1">Plateforme</label>
                                <select
                                  id={`sched-platform-${i}`}
                                  value={scheduledPlatform ?? ''}
                                  onChange={(e) => setScheduledPlatform(e.target.value as SocialPlatform)}
                                  className="w-full glass rounded-lg px-3 py-2 border border-white/10 text-xs bg-[#0a0a0f]"
                                >
                                  <option value="" className="bg-[#0a0a0f]">— Sélectionner —</option>
                                  {PUBLISH_PLATFORMS.map((p) => (
                                    <option key={p.id} value={p.id} className="bg-[#0a0a0f]">{p.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label htmlFor={`sched-date-${i}`} className="text-[11px] text-gray-400 block mb-1">Date &amp; heure</label>
                                <input
                                  id={`sched-date-${i}`}
                                  type="datetime-local"
                                  value={scheduledDate}
                                  onChange={(e) => setScheduledDate(e.target.value)}
                                  className="w-full glass rounded-lg px-3 py-2 border border-white/10 text-xs bg-[#0a0a0f] [color-scheme:dark]"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setShowScheduleMenu(null); setScheduledPlatform(null); setScheduledDate(''); }}
                                  className="flex-1 px-3 py-2 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs"
                                >
                                  Annuler
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleScheduleConfirm(piece)}
                                  disabled={publishing || !scheduledPlatform || !scheduledDate}
                                  className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 text-xs font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                                >
                                  {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Calendar className="w-3.5 h-3.5" aria-hidden="true" />}
                                  Confirmer
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={cn('glass rounded-xl p-4 border border-white/5 text-sm text-gray-200 leading-relaxed', !batch && 'min-h-[200px]')}
                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {piece}
                      </div>
                    </div>
                  ))}

                  {/* Footer */}
                  <div className="card-premium py-3 px-4 flex flex-wrap items-center gap-3">
                    <span className="text-xs text-gray-400">Crédits restants&nbsp;: <strong className="text-white">{creditsRemaining ?? '—'}</strong></span>
                    <button type="button" onClick={handleGenerate} disabled={generating}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors">
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
