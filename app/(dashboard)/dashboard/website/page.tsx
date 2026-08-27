// AfriLaunch AI — Site web module (génération IA réelle)
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Sparkles, Loader2, Download, Copy, RefreshCw, Maximize2,
  Rocket, ShoppingBag, UtensilsCrossed, Briefcase, FileText, Building2,
  type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
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

export default function WebsitePage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [template, setTemplate] = useState<string>('landing');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [orgLoaded, setOrgLoaded] = useState(false);

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

  async function handleGenerate() {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Connectez-vous pour générer', variant: 'warning' });
      return;
    }
    setGenerating(true);
    setGeneratedHtml(null);
    try {
      const res = await fetch('/api/ai/generate', {
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
        setGenerating(false);
        return;
      }
      // Strip markdown code fences if present
      let html = data.content.replace(/^```html?\s*/i, '').replace(/```\s*$/, '').trim();

      // Sanitize: force all content visible (fixes slide-in opacity:0 + other hidden elements)
      // Many AI-generated sites use opacity:0 or transform animations that need JS to reveal.
      // In the sandboxed iframe, scripts may not run reliably, so we force-visible everything.
      html = html.replace(/\.slide-in\s*\{[^}]*opacity:\s*0[^}]*\}/gi, (match: string) => {
        return match.replace(/opacity:\s*0[^;]*;?/gi, 'opacity: 1;');
      });
      html = html.replace(/\.slide-in\s*\{[^}]*transform:\s*translateY\([^)]*\)[^}]*\}/gi, (match: string) => {
        return match.replace(/transform:\s*translateY\([^)]*\)[^;]*;?/gi, 'transform: none;');
      });
      // Also inject a forced-visible style right before </head> as a safety net
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

      // Auto-close HTML if truncated (missing </body></html>)
      if (!html.includes('</body>')) {
        html += '\n</body>';
      }
      if (!html.includes('</html>')) {
        html += '\n</html>';
      }

      setGeneratedHtml(html);
      if (typeof data.creditsRemaining === 'number') setCreditsRemaining(data.creditsRemaining);
      toast({ title: 'Site généré ! 🌐', description: '10 crédits débités', variant: 'success' });
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setGenerating(false);
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

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-cyan-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Site web"
          description="Générez votre landing page, boutique ou site vitrine en minutes avec l'IA. Choisissez un template et laissez l'IA générer le contenu."
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
                          className={cn(
                            'flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all',
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
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-blue-500/40 outline-none text-sm"
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
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-blue-500/40 outline-none text-sm"
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
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-blue-500/40 outline-none text-sm font-mono uppercase"
                      aria-label="Code couleur hexadécimal"
                    />
                  </div>
                </div>

                {/* Generate button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-cyan-600 hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Génération (30 crédits)...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" aria-hidden="true" /> Générer le site (30 crédits)
                    </>
                  )}
                </button>

                {!user && (
                  <p className="text-xs text-amber-400 text-center">Connectez-vous pour générer</p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Preview (right) ───────────────────────────────────── */}
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
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" aria-hidden="true" />
                  <p className="text-sm text-gray-400">L'IA génère votre site web...</p>
                  <p className="text-xs text-gray-600 mt-2">HTML, CSS, sections, contenu — en 15-30s</p>
                </motion.div>
              )}

              {/* Empty state */}
              {!generating && !generatedHtml && (
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
              {!generating && generatedHtml && (
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
                      <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" /> Voir en plein écran
                    </button>
                    <button
                      type="button"
                      onClick={copyCode}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copier le code
                    </button>
                    <button
                      type="button"
                      onClick={downloadHtml}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 hover:scale-[1.02] transition-transform text-xs font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" /> Télécharger HTML
                    </button>
                  </div>

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
                      disabled={generating}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Régénérer
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed px-1">
                    Le site est généré en HTML/CSS/JS complet avec Tailwind CSS. Vous pouvez l'héberger n'importe où.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
