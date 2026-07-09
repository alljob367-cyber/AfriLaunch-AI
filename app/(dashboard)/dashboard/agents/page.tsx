// AfriLaunch AI — Agents IA Marketplace
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette, PenSquare, Search, Megaphone, Headphones, BarChart3,
  ShoppingBag, Mail, Video, Globe, Code, FileText, TrendingUp,
  Bot, Sparkles, Zap, Check, ArrowRight, X, type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { useStats } from '@/hooks/use-stats';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  icon: LucideIcon;
  name: string;
  role: string;
  description: string;
  color: string;
  category: 'creation' | 'growth' | 'operations' | 'intelligence';
  features: string[];
  active: boolean;
  creditsPerRun: number;
  runsThisMonth: number;
}

const agents: Agent[] = [
  { id: 'branding', icon: Palette, name: 'Branding Agent', role: 'Identité de marque', description: 'Génère votre nom, logo, palette et charte graphique adaptés au marché africain. 4 variants par requête.', color: 'from-violet-500 to-purple-600', category: 'creation', features: ['Logo vectoriel', 'Palette panafricaine', 'Charte complète', 'Variants responsive'], active: true, creditsPerRun: 20, runsThisMonth: 14 },
  { id: 'content', icon: PenSquare, name: 'Content Agent', role: 'Création de contenu', description: 'Posts, reels, flyers, scripts vidéo et newsletters. 50+ formats pré-configurés pour chaque réseau.', color: 'from-pink-500 to-rose-600', category: 'creation', features: ['50+ formats', 'Multilingue (FR, EN, SW, AR)', 'Calendrier auto', 'Hashtags IA'], active: true, creditsPerRun: 5, runsThisMonth: 87 },
  { id: 'seo', icon: Search, name: 'SEO Agent', role: 'Optimisation référencement', description: 'Analyse votre site, identifie les mots-clés à fort potentiel africain, optimise meta et contenu.', color: 'from-emerald-500 to-green-600', category: 'intelligence', features: ['Audit technique', 'Mots-clés locaux', 'Optimisation on-page', 'Suivi positions'], active: true, creditsPerRun: 15, runsThisMonth: 6 },
  { id: 'ads', icon: Megaphone, name: 'Ads Agent', role: 'Publicités & campagnes', description: 'Crée et optimise vos publicités Meta, TikTok et Google. A/B testing automatique du ciblage.', color: 'from-orange-500 to-amber-600', category: 'growth', features: ['Meta & TikTok Ads', 'Optimisation IA', 'A/B testing auto', 'ROI tracking'], active: false, creditsPerRun: 25, runsThisMonth: 0 },
  { id: 'support', icon: Headphones, name: 'Support Agent', role: 'Service client 24/7', description: 'Chatbot multilingue pour WhatsApp, Instagram DM et email. Résout 80% des requêtes automatiquement.', color: 'from-cyan-500 to-blue-600', category: 'operations', features: ['WhatsApp + IG + Email', 'Multilingue', 'Escalade humaine', 'Base de connaissances'], active: true, creditsPerRun: 1, runsThisMonth: 342 },
  { id: 'analytics-agent', icon: BarChart3, name: 'Analytics Agent', role: 'Analyse prédictive', description: 'Suit portée, engagement, conversions. Prédit les meilleurs moments de publication et opportunités.', color: 'from-sky-500 to-indigo-600', category: 'intelligence', features: ['Tableau temps réel', 'Prédictions IA', 'Rapports PDF', 'Alertes anomalies'], active: true, creditsPerRun: 10, runsThisMonth: 22 },
  { id: 'ecommerce', icon: ShoppingBag, name: 'E-commerce Agent', role: 'Optimisation boutique', description: 'Optimise fiches produits, prix, photos et tunnel de vente. Recommandations cross-sell personnalisées.', color: 'from-teal-500 to-emerald-600', category: 'operations', features: ['Fiches produits IA', 'Pricing dynamique', 'Cross-sell', 'Abandoned cart'], active: false, creditsPerRun: 18, runsThisMonth: 0 },
  { id: 'email', icon: Mail, name: 'Email Agent', role: 'Newsletter & séquences', description: 'Rédige, programme et optimise newsletters et séquences email. Segmentation automatique audience.', color: 'from-rose-500 to-pink-600', category: 'growth', features: ['Séquences auto', 'A/B testing sujet', 'Segmentation IA', 'Délivrabilité'], active: true, creditsPerRun: 8, runsThisMonth: 19 },
  { id: 'video', icon: Video, name: 'Video Agent', role: 'Scripts & montages', description: 'Génère scripts vidéo, storyboards, sous-titres et montages courts pour TikTok, Reels, Shorts.', color: 'from-red-500 to-orange-600', category: 'creation', features: ['Scripts vidéo', 'Storyboard auto', 'Sous-titres multilingues', 'Montage court'], active: false, creditsPerRun: 30, runsThisMonth: 0 },
  { id: 'localization', icon: Globe, name: 'Localization Agent', role: 'Traduction & adaptation', description: 'Traduit et adapte culturellement votre contenu pour 54 pays africains. Wolof, Swahili, Yoruba, etc.', color: 'from-indigo-500 to-violet-600', category: 'operations', features: ['30+ langues africaines', 'Adaptation culturelle', 'Voix-off natives', 'Devises locales'], active: true, creditsPerRun: 6, runsThisMonth: 41 },
  { id: 'dev', icon: Code, name: 'Dev Agent', role: 'Code & intégrations', description: 'Génère snippets, intégrations API (Stripe, Flutterwave, WhatsApp Business) et automatise workflows.', color: 'from-slate-500 to-gray-600', category: 'operations', features: ['API integrations', 'Webhooks', 'Custom workflows', 'Code review'], active: false, creditsPerRun: 20, runsThisMonth: 0 },
  { id: 'legal', icon: FileText, name: 'Legal Agent', role: 'Contrats & conformité', description: 'Rédige CGV, contrats prestataires, mentions légales. Conformité RGPD et lois locales africaines.', color: 'from-amber-500 to-yellow-600', category: 'operations', features: ['CGV personnalisées', 'Contrats type', 'Conformité RGPD', 'Lois locales'], active: false, creditsPerRun: 12, runsThisMonth: 0 },
  { id: 'growth', icon: TrendingUp, name: 'Growth Agent', role: 'Stratégie de croissance', description: 'Identifie créneaux porteurs, opportunités marché, partenaires potentiels. Roadmap croissance sur 90j.', color: 'from-green-500 to-teal-600', category: 'growth', features: ['Analyse marché', 'Roadmap 90j', 'Veille concurrents', 'Opportunités IA'], active: true, creditsPerRun: 22, runsThisMonth: 8 },
];

const categories = [
  { id: 'all', label: 'Tous', count: agents.length },
  { id: 'creation', label: 'Création', count: agents.filter((a) => a.category === 'creation').length },
  { id: 'growth', label: 'Croissance', count: agents.filter((a) => a.category === 'growth').length },
  { id: 'operations', label: 'Opérations', count: agents.filter((a) => a.category === 'operations').length },
  { id: 'intelligence', label: 'Intelligence', count: agents.filter((a) => a.category === 'intelligence').length },
];

export default function AgentsPage() {
  const { toast } = useToast();
  const { stats } = useStats();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const filtered = activeCategory === 'all' ? agents : agents.filter((a) => a.category === activeCategory);
  const activeCount = agents.filter((a) => a.active).length;
  const totalRuns = agents.reduce((s, a) => s + a.runsThisMonth, 0);

  const handleToggle = (agent: Agent) => {
    toast({
      title: agent.active ? `Agent ${agent.name} désactivé` : `Agent ${agent.name} activé`,
      description: agent.active ? 'L\'agent ne s\'exécutera plus automatiquement.' : `L'agent est maintenant actif. ${agent.creditsPerRun} crédits par exécution.`,
      variant: agent.active ? 'warning' : 'success',
    });
  };

  const handleRun = (agent: Agent) => {
    if ((stats?.aiCredits ?? 0) < agent.creditsPerRun) {
      toast({ title: 'Crédits insuffisants', description: `Cette exécution nécessite ${agent.creditsPerRun} crédits.`, variant: 'error' });
      return;
    }
    toast({ title: `${agent.name} lancé`, description: `Exécution en cours... ${agent.creditsPerRun} crédits débités. Vous serez notifié du résultat.`, variant: 'success' });
    setSelectedAgent(null);
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-indigo-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto">
        <ModuleHeader title="Agents IA" description="13 agents spécialisés pour automatiser votre business africain. Chaque agent est un expert métier formé sur les réalités du marché local." icon={Bot} gradient="from-indigo-500 to-violet-600" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-premium">
            <div className="flex items-center gap-2 mb-2"><div className="status-dot active" aria-hidden="true" /><span className="text-xs text-muted-foreground uppercase tracking-wide">Actifs</span></div>
            <p className="text-2xl font-bold tabular-nums">{activeCount}<span className="text-sm text-muted-foreground">/{agents.length}</span></p>
          </div>
          <div className="card-premium">
            <div className="flex items-center gap-2 mb-2"><Zap className="w-3.5 h-3.5 text-yellow-500" aria-hidden="true" /><span className="text-xs text-muted-foreground uppercase tracking-wide">Exécutions / mois</span></div>
            <p className="text-2xl font-bold tabular-nums">{totalRuns}</p>
          </div>
          <div className="card-premium">
            <div className="flex items-center gap-2 mb-2"><Sparkles className="w-3.5 h-3.5 text-violet-500" aria-hidden="true" /><span className="text-xs text-muted-foreground uppercase tracking-wide">Crédits restants</span></div>
            <p className="text-2xl font-bold tabular-nums">{stats?.aiCredits ?? 0}</p>
          </div>
          <div className="card-premium">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-3.5 h-3.5 text-green-500" aria-hidden="true" /><span className="text-xs text-muted-foreground uppercase tracking-wide">Économie temps</span></div>
            <p className="text-2xl font-bold tabular-nums">47h</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Catégories d'agents">
          {categories.map((cat) => (
            <button key={cat.id} type="button" role="tab" aria-selected={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)}
              className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-all', activeCategory === cat.id ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg' : 'glass text-gray-400 hover:text-white hover:bg-white/10')}>
              {cat.label} <span className="text-xs opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((agent, i) => (
            <motion.div key={agent.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 22 }}
              className="group glass rounded-2xl p-6 border border-white/5 hover:border-white/15 transition-all duration-300 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                  <agent.icon className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <button type="button" onClick={() => handleToggle(agent)} aria-pressed={agent.active} aria-label={agent.active ? `Désactiver ${agent.name}` : `Activer ${agent.name}`}
                  className={cn('relative w-11 h-6 rounded-full transition-colors', agent.active ? 'bg-green-500' : 'bg-gray-700')}>
                  <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform', agent.active ? 'translate-x-5' : 'translate-x-0.5')} />
                </button>
              </div>
              <h3 className="font-bold text-base mb-1">{agent.name}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">{agent.role}</p>
              <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-1">{agent.description}</p>
              <div className="flex items-center gap-4 text-[11px] text-gray-500 mb-4">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" aria-hidden="true" />{agent.creditsPerRun} crédits</span>
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-violet-500" aria-hidden="true" />{agent.runsThisMonth} ce mois</span>
              </div>
              <button type="button" onClick={() => setSelectedAgent(agent)} disabled={!agent.active}
                className={cn('w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2', agent.active ? `bg-gradient-to-r ${agent.color} text-white hover:scale-[1.02] shadow-lg` : 'glass text-gray-500 cursor-not-allowed')}>
                Configurer <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedAgent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAgent(null)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="agent-modal-title">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-8 max-w-lg w-full border border-white/10 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
              <button type="button" onClick={() => setSelectedAgent(null)} aria-label="Fermer" className="absolute top-4 right-4 p-2 rounded-lg glass hover:bg-white/10"><X className="w-4 h-4" aria-hidden="true" /></button>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedAgent.color} flex items-center justify-center shadow-lg mb-5`}><selectedAgent.icon className="w-8 h-8 text-white" aria-hidden="true" /></div>
              <h2 id="agent-modal-title" className="text-2xl font-bold mb-1">{selectedAgent.name}</h2>
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-4">{selectedAgent.role}</p>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">{selectedAgent.description}</p>
              <div className="mb-6"><p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Capacités</p>
                <ul className="space-y-2">{selectedAgent.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${selectedAgent.color} flex items-center justify-center flex-shrink-0`}><Check className="w-3 h-3 text-white" aria-hidden="true" /></div>{f}
                  </li>))}</ul>
              </div>
              <div className="glass rounded-xl p-4 mb-6 grid grid-cols-3 gap-4 text-center">
                <div><p className="text-xs text-gray-500 mb-1">Crédits / exécution</p><p className="font-bold tabular-nums">{selectedAgent.creditsPerRun}</p></div>
                <div><p className="text-xs text-gray-500 mb-1">Runs ce mois</p><p className="font-bold tabular-nums">{selectedAgent.runsThisMonth}</p></div>
                <div><p className="text-xs text-gray-500 mb-1">Statut</p><p className="font-bold flex items-center justify-center gap-1"><div className="status-dot active" aria-hidden="true" /> Actif</p></div>
              </div>
              <button type="button" onClick={() => handleRun(selectedAgent)} className={`w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r ${selectedAgent.color} text-white hover:scale-[1.02] transition-transform shadow-lg flex items-center justify-center gap-2`}>
                <Sparkles className="w-4 h-4" aria-hidden="true" /> Lancer une exécution ({selectedAgent.creditsPerRun} crédits)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
