// AfriLaunch AI — Identité de marque (génération IA réelle)
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette, Sparkles, Loader2, Download, Check, RefreshCw, Copy,
  Type, Droplet, ImageIcon, Megaphone, BookOpen,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

interface BrandKit {
  brandName: string;
  tagline: string;
  description: string;
  logo: { concept: string; style: string; colors: string[] };
  palette: { primary: string; secondary: string; accent: string; background: string; text: string; name: string };
  typography: { heading: string; body: string; rationale: string };
  voice: { tone: string; personality: string[]; keywords: string[] };
  socialKit: {
    instagram: { bio: string; hashtags: string[] };
    twitter: { bio: string };
    facebook: { about: string };
    linkedin: { tagline: string };
  };
  brandGuidelines: { do: string[]; dont: string[] };
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

export default function IdentityPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('Sénégal');
  const [style, setStyle] = useState('Moderne et professionnel');
  const [generating, setGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [orgLoaded, setOrgLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/organization', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.organization) {
          const org = data.organization;
          if (org.name) setBusinessName(prev => prev || org.name);
          if (org.industry) setIndustry(prev => prev || org.industry);
          if (org.country) setCountry(prev => prev || org.country);
        }
        setOrgLoaded(true);
      })
      .catch(() => setOrgLoaded(true));
  }, []);

  async function handleGenerate() {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Connectez-vous pour générer', variant: 'warning' });
      return;
    }
    setGenerating(true);
    setKit(null);
    setStatusMsg('Démarrage de la génération...');
    try {
      const res = await fetch('/api/ai/generate-async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'identity', businessName, industry, country, style }),
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.insufficientCredits) {
          toast({ title: 'Crédits insuffisants', description: 'La génération d\'identité coûte 20 crédits. Rechargez votre compte.', variant: 'error' });
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
      // Parse JSON from the AI reply
      try {
        const jsonStr = (result.content || '').replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(jsonStr);
        setKit(parsed);
        toast({
          title: 'Identité générée ! 🎨',
          description: `20 crédits débités. ${creditsRemaining} restants.`,
          variant: 'success',
        });
      } catch (parseErr) {
        toast({ title: 'Erreur de parsing', description: 'L\'IA n\'a pas retourné un JSON valide. Réessayez.', variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setGenerating(false);
      setStatusMsg('');
    }
  }

  async function handleDownloadKit() {
    if (!kit) return;
    try {
      const res = await fetch('/api/download/kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ kit }),
      });
      const data = await res.json();
      if (data.ok) {
        // Download the main JSON file
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = data.filename;
        a.click();
        toast({ title: 'Kit téléchargé', description: 'brand-identity.json téléchargé. Manifest complet dans la console.', variant: 'success' });
        // Also download each text file
        for (const file of data.manifest.files.slice(2)) {
          const fileUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(file.content)}`;
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = file.name;
          link.click();
        }
      }
    } catch (err) {
      toast({ title: 'Erreur téléchargement', description: (err as Error).message, variant: 'error' });
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copié`, variant: 'success' });
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Identité de marque"
          description="Générez votre nom, logo, palette, typographie et kit média complet avec l'IA. 20 crédits par génération."
          icon={Palette}
          gradient="from-violet-500 to-purple-600"
          action={
            kit && (
              <button type="button" onClick={handleDownloadKit} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:scale-105 transition-transform shadow-lg">
                <Download className="w-4 h-4" aria-hidden="true" /> Télécharger le kit
              </button>
            )
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="card-premium sticky top-6">
              <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" aria-hidden="true" />
                Configuration
              </h2>
              <div className="space-y-4">
                {orgLoaded && (
                  <p className="text-[11px] text-gray-500 mb-1">
                    💡 Pré-rempli depuis votre <Link href="/dashboard/organization" className="text-slate-400 hover:text-white underline">organisation</Link>
                  </p>
                )}
                <div>
                  <label htmlFor="business-name" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">Nom du business</label>
                  <input id="business-name" type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ex: Teranga Mode" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-violet-500/40 outline-none text-sm" />
                </div>
                <div>
                  <label htmlFor="industry" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">Industrie</label>
                  <input id="industry" type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ex: Mode, Restaurant, Tech..." className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-violet-500/40 outline-none text-sm" />
                </div>
                <div>
                  <label htmlFor="country" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">Pays / Région</label>
                  <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-violet-500/40 outline-none text-sm bg-[#0a0a0f]">
                    {['Sénégal', 'Côte d\'Ivoire', 'Ghana', 'Nigeria', 'Kenya', 'Maroc', 'Cameroun', 'Mali', 'Burkina Faso', 'Bénin', 'Togo', 'Guinée', 'Congo', 'Gabon', 'Madagascar'].map((c) => <option key={c} value={c} className="bg-[#0a0a0f]">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="style" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">Style souhaité</label>
                  <select id="style" value={style} onChange={(e) => setStyle(e.target.value)} className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-violet-500/40 outline-none text-sm bg-[#0a0a0f]">
                    {['Moderne et professionnel', 'Ludique et coloré', 'Minimaliste et élégant', 'Luxe et premium', 'Traditionnel et authentique', 'Tech et futuriste'].map((s) => <option key={s} value={s} className="bg-[#0a0a0f]">{s}</option>)}
                  </select>
                </div>
                <button type="button" onClick={handleGenerate} disabled={generating} className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Génération (20 crédits)...</> : <><Sparkles className="w-4 h-4" aria-hidden="true" /> Générer l'identité (20 crédits)</>}
                </button>
                {!user && <p className="text-xs text-amber-400 text-center">Connectez-vous pour générer</p>}
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {generating && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card-premium flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin text-violet-500 mb-4" aria-hidden="true" />
                  <p className="text-sm text-gray-400">{statusMsg || "L'IA crée votre identité de marque..."}</p>
                  <p className="text-xs text-gray-600 mt-2">Logo, palette, typographie, bios, guidelines</p>
                </motion.div>
              )}

              {!generating && !kit && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-premium flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg mb-5">
                    <Palette className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Aucune identité générée</h3>
                  <p className="text-sm text-gray-400 max-w-md text-center">Configurez votre business à gauche et cliquez sur "Générer l'identité". L'IA crée un kit complet en 10-20 secondes.</p>
                </motion.div>
              )}

              {!generating && kit && (
                <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Brand name + tagline */}
                  <div className="card-premium">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-violet-400 uppercase tracking-wide mb-1">Nom de marque</p>
                        <h2 className="text-3xl font-bold gradient-text">{kit.brandName}</h2>
                        <p className="text-sm text-gray-400 mt-2 italic">"{kit.tagline}"</p>
                      </div>
                      <button type="button" onClick={() => copyToClipboard(kit.brandName, 'Nom')} className="p-2 rounded-lg glass hover:bg-white/10"><Copy className="w-4 h-4" aria-hidden="true" /></button>
                    </div>
                    <p className="text-sm text-gray-300 mt-4 leading-relaxed">{kit.description}</p>
                  </div>

                  {/* Logo concept */}
                  <div className="card-premium">
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="w-5 h-5 text-violet-500" aria-hidden="true" />
                      <h3 className="font-bold">Concept de logo</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300">{kit.logo.style}</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{kit.logo.concept}</p>
                    <div className="flex gap-2 mt-3">
                      {kit.logo.colors.map((c, i) => (
                        <div key={i} className="w-8 h-8 rounded-lg border border-white/10" style={{ backgroundColor: c }} title={c} />
                      ))}
                    </div>
                  </div>

                  {/* Palette */}
                  <div className="card-premium">
                    <div className="flex items-center gap-2 mb-3">
                      <Droplet className="w-5 h-5 text-violet-500" aria-hidden="true" />
                      <h3 className="font-bold">Palette — {kit.palette.name}</h3>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { name: 'Primaire', color: kit.palette.primary },
                        { name: 'Secondaire', color: kit.palette.secondary },
                        { name: 'Accent', color: kit.palette.accent },
                        { name: 'Fond', color: kit.palette.background },
                        { name: 'Texte', color: kit.palette.text },
                      ].map((p) => (
                        <div key={p.name} className="text-center">
                          <div className="w-full aspect-square rounded-xl border border-white/10 mb-1" style={{ backgroundColor: p.color }} />
                          <p className="text-[10px] text-gray-500">{p.name}</p>
                          <p className="text-[10px] font-mono text-gray-400">{p.color}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typography */}
                  <div className="card-premium">
                    <div className="flex items-center gap-2 mb-3">
                      <Type className="w-5 h-5 text-violet-500" aria-hidden="true" />
                      <h3 className="font-bold">Typographie</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Titres</p>
                        <p className="text-xl font-bold" style={{ fontFamily: kit.typography.heading }}>{kit.typography.heading}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Corps</p>
                        <p className="text-base" style={{ fontFamily: kit.typography.body }}>{kit.typography.body}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">{kit.typography.rationale}</p>
                  </div>

                  {/* Voice */}
                  <div className="card-premium">
                    <div className="flex items-center gap-2 mb-3">
                      <Megaphone className="w-5 h-5 text-violet-500" aria-hidden="true" />
                      <h3 className="font-bold">Voix de la marque</h3>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">Ton: <strong>{kit.voice.tone}</strong></p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {kit.voice.personality.map((p) => <span key={p} className="text-xs px-2 py-1 rounded-lg bg-violet-500/15 text-violet-300">{p}</span>)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {kit.voice.keywords.map((k) => <span key={k} className="text-xs px-2 py-1 rounded-lg glass text-gray-400">#{k}</span>)}
                    </div>
                  </div>

                  {/* Social kit */}
                  <div className="card-premium">
                    <h3 className="font-bold mb-3">Kit réseaux sociaux</h3>
                    <div className="space-y-3">
                      {[
                        { platform: 'Instagram', bio: kit.socialKit.instagram.bio, hashtags: kit.socialKit.instagram.hashtags },
                        { platform: 'Twitter/X', bio: kit.socialKit.twitter.bio },
                        { platform: 'Facebook', bio: kit.socialKit.facebook.about },
                        { platform: 'LinkedIn', bio: kit.socialKit.linkedin.tagline },
                      ].map((s) => (
                        <div key={s.platform} className="p-3 rounded-lg glass">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-violet-300">{s.platform}</p>
                            <button type="button" onClick={() => copyToClipboard(s.bio, s.platform)} className="text-gray-500 hover:text-white"><Copy className="w-3 h-3" aria-hidden="true" /></button>
                          </div>
                          <p className="text-sm text-gray-300">{s.bio}</p>
                          {s.hashtags && <p className="text-xs text-gray-500 mt-1">{s.hashtags.join(' ')}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guidelines */}
                  <div className="card-premium">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-5 h-5 text-violet-500" aria-hidden="true" />
                      <h3 className="font-bold">Brand guidelines</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-green-400 mb-2">✓ À faire</p>
                        <ul className="space-y-1">{kit.brandGuidelines.do.map((d) => <li key={d} className="text-xs text-gray-300 flex items-start gap-1"><Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />{d}</li>)}</ul>
                      </div>
                      <div>
                        <p className="text-xs text-red-400 mb-2">✗ À éviter</p>
                        <ul className="space-y-1">{kit.brandGuidelines.dont.map((d) => <li key={d} className="text-xs text-gray-300 flex items-start gap-1"><span className="text-red-500 mt-0.5">✗</span>{d}</li>)}</ul>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button type="button" onClick={handleGenerate} disabled={generating} className="flex-1 py-3 rounded-xl font-semibold text-sm glass border border-white/10 hover:bg-white/10 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4" aria-hidden="true" /> Régénérer
                    </button>
                    <button type="button" onClick={handleDownloadKit} className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:scale-[1.02] transition-transform shadow-lg flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" aria-hidden="true" /> Télécharger le kit
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
