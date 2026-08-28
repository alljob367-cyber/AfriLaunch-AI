// AfriLaunch AI — Site web module (génération IA + publication auto + background jobs)
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Sparkles, Loader2, Download, Copy, RefreshCw, Maximize2,
  Rocket, ShoppingBag, UtensilsCrossed, Briefcase, FileText, Building2,
  Share2, Trash2, ExternalLink, Eye, Check, Lock,
  type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { useBackgroundJobs } from '@/hooks/use-background-jobs';
import { cn } from '@/lib/utils';

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

const TEMPLATES: TemplateOption[] = [
  { id: 'landing', name: 'Landing', description: 'Page d\'atterrissage', icon: Rocket },
  { id: 'ecommerce', name: 'E-commerce', description: 'Boutique en ligne', icon: ShoppingBag },
  { id: 'restaurant', name: 'Restaurant', description: 'Menu & réservation', icon: UtensilsCrossed },
  { id: 'portfolio', name: 'Portfolio', description: 'Vitrine créative', icon: Briefcase },
  { id: 'blog', name: 'Blog', description: 'Articles & newsletter', icon: FileText },
  { id: 'business', name: 'Business', description: 'Site vitrine pro', icon: Building2 },
];

// Sanitize the AI-generated HTML (force visible, close tags, etc.)
function sanitizeHtml(content: string): string {
  let html = content.replace(/^```html?\s*/i, '').replace(/```\s*$/, '').trim();
  html = html.replace(/\.slide-in\s*\{[^}]*opacity:\s*0[^}]*\}/gi, (match: string) =>
    match.replace(/opacity:\s*0[^;]*;?/gi, 'opacity: 1;'),
  );
  html = html.replace(/\.slide-in\s*\{[^}]*transform:\s*translateY\([^)]*\)[^}]*\}/gi, (match: string) =>
    match.replace(/transform:\s*translateY\([^)]*\)[^;]*;?/gi, 'transform: none;'),
  );
  const forceVisibleCSS = `<style>
    .slide-in, .fade-in, .fade-up, .reveal { opacity: 1 !important; transform: none !important; }
    [style*="opacity: 0"], [style*="opacity:0"] { opacity: 1 !important; }
    [style*="display: none"], [style*="display:none"] { display: block !important; }
  </style>`;
  if (html.includes('</head>')) {
    html = html.replace('</head>', forceVisibleCSS + '\n</head>');
  } else if (html.includes('<body')) {
    html = html.replace('<body', forceVisibleCSS + '\n<body');
  } else {
    html = forceVisibleCSS + html;
  }
  if (!html.includes('</body>')) html += '\n</body>';
  if (!html.includes('</html>')) html += '\n</html>';
  return html;
}

export default function WebsitePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { jobs, registerJob } = useBackgroundJobs();

  const [template, setTemplate] = useState<string>('landing');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [orgLoaded, setOrgLoaded] = useState(false);
  const restoredRef = useRef<Set<string>>(new Set());

  // Publication state
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishedSites, setPublishedSites] = useState<Array<{
    id: string; slug: string; title: string; url: string;
    views: number; createdAt: number;
  }>>([]);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  // Load user's published sites on mount
  const fetchPublishedSites = useRef(async () => {
    try {
      const res = await fetch('/api/sites/list', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setPublishedSites(data.sites);
    } catch { /* ignore */ }
  });
  useEffect(() => { fetchPublishedSites.current(); }, []);

  useEffect(() => {
    fetch('/api/organization', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.organization) {
          const org = data.organization;
          if (org.name) setBusinessName(prev => prev || org.name);
          if (org.industry) setIndustry(prev => prev || org.industry);
        }
        setOrgLoaded(true);
      })
      .catch(() => setOrgLoaded(true));
  }, []);

  // Find the latest website job (active or recently done) — this lets the
  // user navigate away and come back without losing the in-progress or
  // finished generation.
  const websiteJob = jobs.find((j) => j.type === 'website');
  const isGenerating = !!websiteJob && (websiteJob.status === 'pending' || websiteJob.status === 'running');

  // Plan gate: only 'business' and 'enterprise' can publish sites publicly.
  // Admins always bypass.
  const userPlan = (user as any)?.plan as string | undefined;
  const isAdmin = (user as any)?.isAdmin === true || user?.email === 'admin@albermon.com' || user?.email === 'admin@afrilaunch.ai';
  const canPublish = isAdmin || userPlan === 'business' || userPlan === 'enterprise';

  // Auto-restore the generated HTML when a job completes (even if user
  // navigated away and came back)
  useEffect(() => {
    if (!websiteJob) return;
    if (websiteJob.status === 'done' && websiteJob.result?.content && !restoredRef.current.has(websiteJob.jobId)) {
      restoredRef.current.add(websiteJob.jobId);
      setGeneratedHtml(sanitizeHtml(websiteJob.result.content));
      toast({
        title: 'Site restauré ✅',
        description: `Votre site est prêt (${websiteJob.elapsed}s)`,
        variant: 'success',
      });
    }
    if (websiteJob.status === 'failed' && !restoredRef.current.has(websiteJob.jobId)) {
      restoredRef.current.add(websiteJob.jobId);
      toast({
        title: 'Génération échouée',
        description: websiteJob.error || 'Erreur inconnue',
        variant: 'error',
      });
    }
  }, [websiteJob, toast]);

  async function handleGenerate() {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Connectez-vous pour générer', variant: 'warning' });
      return;
    }
    setGeneratedHtml(null);
    try {
      const res = await fetch('/api/ai/generate-async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'website', template, businessName, industry, primaryColor }),
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.insufficientCredits) {
          toast({ title: 'Crédits insuffisants', description: 'La génération de site coûte 30 crédits. Rechargez votre compte.', variant: 'error' });
        } else {
          toast({ title: 'Échec', description: data.error, variant: 'error' });
        }
        return;
      }
      // Register the job with the background-jobs hook — polling happens
      // globally in the dashboard layout, so the user can navigate away
      // and the job will keep running + a toast will fire when done.
      registerJob(data.jobId, 'website', { template, businessName, industry });
      if (typeof data.creditsRemaining === 'number') setCreditsRemaining(data.creditsRemaining);
      toast({
        title: 'Génération démarrée 🚀',
        description: 'Vous pouvez changer de page — la génération continue en arrière-plan.',
        variant: 'success',
      });
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    }
  }

  function openFullscreen() {
    if (!generatedHtml) return;
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) {
      toast({ title: 'Pop-up bloqué', description: 'Autorisez les pop-ups pour ouvrir le site en plein écran.', variant: 'warning' });
      return;
    }
    w.document.open();
    w.document.write(generatedHtml);
    w.document.close();
  }

  function copyCode() {
    if (!generatedHtml) return;
    navigator.clipboard.writeText(generatedHtml);
    toast({ title: 'Code copié', description: 'Le HTML est dans votre presse-papiers.', variant: 'success' });
  }

  function downloadHtml() {
    if (!generatedHtml) return;
    const safeName = (businessName || 'site').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'site';
    const url = `data:text/html;charset=utf-8,${encodeURIComponent(generatedHtml)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}-site.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'Téléchargement lancé', description: `${safeName}-site.html`, variant: 'success' });
  }

  async function handlePublish() {
    if (!generatedHtml) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/sites/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ html: generatedHtml, title: businessName || 'Mon site' }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        setPublishedUrl(data.url);
        toast({
          title: 'Site publié ! 🌐',
          description: 'Lien de partage prêt à être copié.',
          variant: 'success',
        });
        // Refresh list
        await fetchPublishedSites.current();
        // Auto-copy to clipboard
        try {
          await navigator.clipboard.writeText(data.url);
          toast({ title: 'Lien copié', description: 'Dans le presse-papiers', variant: 'success' });
        } catch { /* ignore */ }
      } else if (data.upgradeRequired) {
        // Plan restriction — show upgrade toast + redirect to subscription
        toast({
          title: 'Plan Business requis 🔒',
          description: 'Passez au plan Business pour publier votre site en ligne avec un lien partageable.',
          variant: 'warning',
        });
        // Slight delay so the toast is visible before navigation
        setTimeout(() => {
          window.location.href = '/dashboard/subscription';
        }, 1500);
      } else {
        toast({ title: 'Échec publication', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setPublishing(false);
    }
  }

  async function copyShareUrl(url: string, siteId?: string) {
    try {
      await navigator.clipboard.writeText(url);
      if (siteId) {
        setCopiedShareId(siteId);
        setTimeout(() => setCopiedShareId(null), 2000);
      }
      toast({ title: 'Lien copié', description: 'Partagez-le avec vos clients !', variant: 'success' });
    } catch {
      toast({ title: 'Copie impossible', description: 'Copiez manuellement: ' + url, variant: 'warning' });
    }
  }

  async function shareSite(url: string, title: string) {
    // Use Web Share API if available (mobile WhatsApp, etc.)
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, url });
        return;
      } catch { /* user cancelled — fall through to copy */ }
    }
    await copyShareUrl(url);
  }

  async function deletePublishedSite(siteId: string, title: string) {
    if (!confirm(`Supprimer "${title}" ? Le lien ne fonctionnera plus.`)) return;
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok) {
        setPublishedSites((s) => s.filter((x) => x.id !== siteId));
        toast({ title: 'Site supprimé', description: 'Le lien ne fonctionne plus.', variant: 'warning' });
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' });
    }
  }

  // Live status message during generation
  const statusMsg = websiteJob
    ? websiteJob.partialLength
      ? `Génération en cours... ${websiteJob.partialLength.toLocaleString('fr-FR')} caractères générés (${websiteJob.elapsed}s)`
      : `Démarrage de la génération... (${websiteJob.elapsed ?? 0}s)`
    : '';

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-cyan-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Site web"
          description="Générez votre landing page, boutique ou site vitrine en minutes avec l'IA. La génération continue en arrière-plan si vous changez de page."
          icon={Globe}
          gradient="from-blue-500 to-cyan-600"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Form (left, sticky) ───────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="card-premium sticky top-6">
              <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" aria-hidden="true" />
                Configuration
              </h2>

              <div className="space-y-5">
                {orgLoaded && (
                  <p className="text-[11px] text-gray-500">
                    💡 Pré-rempli depuis votre <Link href="/dashboard/organization" className="text-slate-400 hover:text-white underline">organisation</Link>
                  </p>
                )}
                {/* Template selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wide">
                    Template
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATES.map((tpl) => {
                      const Icon = tpl.icon;
                      const selected = template === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setTemplate(tpl.id)}
                          aria-pressed={selected}
                          disabled={isGenerating}
                          className={cn(
                            'flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                            selected
                              ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                              : 'border-white/5 glass hover:bg-white/5',
                          )}
                        >
                          <Icon className="w-5 h-5 text-blue-400" aria-hidden="true" />
                          <span className="text-sm font-semibold">{tpl.name}</span>
                          <span className="text-[10px] text-gray-500 leading-tight">{tpl.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Business name */}
                <div>
                  <label htmlFor="website-business-name" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Nom du business
                  </label>
                  <input
                    id="website-business-name"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex: Teranga Mode"
                    disabled={isGenerating}
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-blue-500/40 outline-none text-sm disabled:opacity-60"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label htmlFor="website-industry" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Industrie
                  </label>
                  <input
                    id="website-industry"
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Ex: Mode, Restaurant, Tech..."
                    disabled={isGenerating}
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-blue-500/40 outline-none text-sm disabled:opacity-60"
                  />
                </div>

                {/* Primary color */}
                <div>
                  <label htmlFor="website-primary-color" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Couleur principale
                  </label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="website-primary-color"
                      className="relative w-12 h-12 rounded-xl border border-white/10 cursor-pointer overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}
                      aria-label="Choisir une couleur"
                    >
                      <input
                        id="website-primary-color"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        disabled={isGenerating}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      disabled={isGenerating}
                      className="flex-1 glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-blue-500/40 outline-none text-sm font-mono uppercase disabled:opacity-60"
                      aria-label="Code couleur hexadécimal"
                    />
                  </div>
                </div>

                {/* Generate button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-cyan-600 hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Génération en cours...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" aria-hidden="true" /> Générer le site (30 crédits)
                    </>
                  )}
                </button>

                {isGenerating && (
                  <p className="text-[11px] text-blue-300 text-center flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    Vous pouvez changer de page — la génération continue en arrière-plan
                  </p>
                )}

                {!user && (
                  <p className="text-xs text-amber-400 text-center">Connectez-vous pour générer</p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Preview (right) ───────────────────────────────────── */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Loading state — shows live progress */}
              {isGenerating && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card-premium flex flex-col items-center justify-center py-20"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" aria-hidden="true" />
                  <p className="text-sm text-gray-400">{statusMsg || "L'IA génère votre site web..."}</p>
                  <p className="text-xs text-gray-600 mt-2">HTML, CSS, sections, contenu — streaming temps réel</p>
                  {websiteJob?.partialLength ? (
                    <div className="mt-4 w-full max-w-xs">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, (websiteJob.partialLength / 4000) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 text-center">
                        {websiteJob.partialLength.toLocaleString('fr-FR')} / ~4000 caractères
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              )}

              {/* Empty state */}
              {!isGenerating && !generatedHtml && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card-premium"
                >
                  <EmptyState
                    icon={Globe}
                    title="Aucun site généré"
                    description="Choisissez un template à gauche, renseignez votre business et cliquez sur « Générer le site ». L'IA produit un HTML/CSS/JS complet avec Tailwind en quelques secondes."
                    gradient="from-blue-500 to-cyan-600"
                  />
                </motion.div>
              )}

              {/* Result */}
              {!isGenerating && generatedHtml && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Action bar */}
                  <div className="card-premium py-3 px-4 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 mr-auto">
                      <Globe className="w-4 h-4 text-blue-400" aria-hidden="true" />
                      <span className="text-sm font-semibold">Aperçu du site</span>
                    </div>
                    <button
                      type="button"
                      onClick={openFullscreen}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" /> Plein écran
                    </button>
                    <button
                      type="button"
                      onClick={copyCode}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Code
                    </button>
                    <button
                      type="button"
                      onClick={downloadHtml}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" /> HTML
                    </button>
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={publishing}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-transform text-xs font-semibold disabled:opacity-60 disabled:hover:scale-100',
                        canPublish
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-[1.02]'
                          : 'glass border border-amber-500/30 text-amber-300 hover:bg-amber-500/10',
                      )}
                      title={canPublish ? 'Publier en ligne' : 'Plan Business requis'}
                    >
                      {publishing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : canPublish ? (
                        <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      {publishing ? 'Publication…' : canPublish ? 'Publier en ligne' : 'Business requis'}
                    </button>
                  </div>

                  {/* Published URL banner */}
                  {publishedUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card-premium py-3 px-4 border border-emerald-500/30 bg-emerald-500/5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-300 mb-0.5">Site en ligne !</p>
                          <a
                            href={publishedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-300 hover:text-blue-200 underline truncate inline-flex items-center gap-1"
                          >
                            {publishedUrl}
                            <ExternalLink className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyShareUrl(publishedUrl)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold"
                        >
                          <Copy className="w-3 h-3" aria-hidden="true" /> Copier
                        </button>
                        <button
                          type="button"
                          onClick={() => shareSite(publishedUrl, businessName || 'Mon site')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-[1.02] transition-transform text-xs font-semibold"
                        >
                          <Share2 className="w-3 h-3" aria-hidden="true" /> Partager
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* iframe preview */}
                  <iframe
                    title="Aperçu du site"
                    srcDoc={generatedHtml}
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-[600px] rounded-xl border border-white/10 bg-white"
                  />

                  {/* Credits + regenerate */}
                  <div className="card-premium py-3 px-4 flex flex-wrap items-center gap-3">
                    <span className="text-xs text-gray-400">
                      Crédits restants&nbsp;: <strong className="text-white">{creditsRemaining ?? '—'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Régénérer
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed px-1">
                    Le site est généré en HTML/CSS/JS complet avec Tailwind CSS. Publiez-le en 1 clic pour obtenir un lien partageable.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Published sites section ─────────────────────────── */}
            {publishedSites.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-premium mt-6"
              >
                <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                  Mes sites publiés
                  <span className="text-xs text-gray-500 font-normal">({publishedSites.length})</span>
                </h2>
                <div className="space-y-2">
                  {publishedSites.map((site) => (
                    <div
                      key={site.id}
                      className="flex items-center gap-3 p-3 rounded-xl glass border border-white/5 hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-white" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{site.title}</p>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-300 hover:text-blue-200 underline truncate inline-flex items-center gap-0.5"
                        >
                          {site.url.replace(/^https?:\/\//, '')}
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" aria-hidden="true" />
                        </a>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mr-2">
                        <Eye className="w-3 h-3" aria-hidden="true" />
                        {site.views}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyShareUrl(site.url, site.id)}
                        aria-label="Copier le lien"
                        className="p-2 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs"
                      >
                        {copiedShareId === site.id
                          ? <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                          : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => shareSite(site.url, site.title)}
                        aria-label="Partager"
                        className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-xs"
                      >
                        <Share2 className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePublishedSite(site.id, site.title)}
                        aria-label="Supprimer"
                        className="p-2 rounded-lg glass border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
