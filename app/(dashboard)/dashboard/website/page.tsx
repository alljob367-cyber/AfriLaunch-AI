// AfriLaunch AI — Site web module
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Plus, Eye, Pencil, ExternalLink, TrendingUp,
  Users, Percent, Layout, ShoppingBag, UtensilsCrossed,
  User, Newspaper, Store, type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  popular?: boolean;
}

interface Site {
  id: string;
  name: string;
  url: string;
  status: 'Publié' | 'Brouillon';
  visits: number;
  gradient: string;
}

const templates: Template[] = [
  { id: 'landing', name: 'Landing', emoji: '🚀', description: 'Page d\'atterrissage orientée conversion', category: 'Marketing', popular: true },
  { id: 'boutique', name: 'Boutique', emoji: '🛍️', description: 'E-commerce complet avec panier et paiement', category: 'E-commerce', popular: true },
  { id: 'restaurant', name: 'Restaurant', emoji: '🍽️', description: 'Menu, réservations et commande en ligne', category: 'Restauration' },
  { id: 'portfolio', name: 'Portfolio', emoji: '🎨', description: 'Vitrine de projets et réalisations', category: 'Créatif' },
  { id: 'blog', name: 'Blog', emoji: '✍️', description: 'Publications SEO et newsletters intégrées', category: 'Éditorial' },
  { id: 'vitrine', name: 'Vitrine', emoji: '🏢', description: 'Site corporate multi-pages professionnel', category: 'Corporate' },
];

const sites: Site[] = [
  { id: 'teranga', name: 'Teranga Mode', url: 'terangamode.afrilaunch.ai', status: 'Publié', visits: 4820, gradient: 'from-pink-500 to-rose-600' },
  { id: 'sahel', name: 'Sahel AgriTech', url: 'sahelagri.afrilaunch.ai', status: 'Brouillon', visits: 0, gradient: 'from-amber-500 to-orange-600' },
];

const stats: { label: string; value: string; icon: LucideIcon; tint: string }[] = [
  { label: 'Sites publiés', value: '2/10', icon: Globe, tint: 'text-blue-400' },
  { label: 'Visiteurs ce mois', value: '12 480', icon: Users, tint: 'text-cyan-400' },
  { label: 'Taux de conversion', value: '3,4 %', icon: Percent, tint: 'text-emerald-400' },
];

export default function WebsitePage() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template.id);
    toast({
      title: `Template ${template.name} sélectionné`,
      description: 'L\'éditeur IA s\'ouvre avec ce modèle pré-configuré.',
      variant: 'success',
    });
  };

  const handleVisit = (site: Site) => {
    if (site.status === 'Brouillon') {
      toast({
        title: 'Site non publié',
        description: `${site.name} est encore en brouillon. Publiez-le d'abord.`,
        variant: 'warning',
      });
      return;
    }
    toast({
      title: 'Ouverture du site',
      description: site.url,
      variant: 'success',
    });
  };

  const handleEdit = (site: Site) => {
    toast({
      title: 'Éditeur ouvert',
      description: `Modification de ${site.name} en cours.`,
      variant: 'success',
    });
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-cyan-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Site web"
          description="Créez et publiez votre site web en minutes. Landing pages, boutiques e-commerce, sites vitrines — générés par IA."
          icon={Globe}
          gradient="from-blue-500 to-cyan-600"
          action={
            <button
              type="button"
              onClick={() => toast({ title: 'Nouveau site', description: 'Sélectionnez un template pour démarrer.', variant: 'success' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-600 hover:scale-105 transition-transform shadow-lg"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> Nouveau site
            </button>
          }
        />

        {/* Stats row */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
          aria-label="Statistiques du site web"
        >
          {stats.map((s) => (
            <div key={s.label} className="card-premium">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={cn('w-4 h-4', s.tint)} aria-hidden="true" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            </div>
          ))}
        </motion.section>

        {/* Templates */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
          aria-labelledby="templates-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <Layout className="w-5 h-5 text-blue-400" aria-hidden="true" />
            <h2 id="templates-title" className="text-xl font-bold">Templates</h2>
            <span className="badge-new">6 disponibles</span>
          </header>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((template, i) => {
              const TemplateIcon: LucideIcon =
                template.id === 'landing' ? Layout :
                template.id === 'boutique' ? ShoppingBag :
                template.id === 'restaurant' ? UtensilsCrossed :
                template.id === 'portfolio' ? User :
                template.id === 'blog' ? Newspaper : Store;
              return (
                <motion.li
                  key={template.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition-all duration-300 flex flex-col"
                >
                  <div className="relative mb-4">
                    <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-600/10 flex items-center justify-center text-5xl border border-white/5">
                      <span role="img" aria-label={template.name}>{template.emoji}</span>
                    </div>
                    {template.popular && (
                      <span className="absolute top-2 right-2 badge-new">Populaire</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <TemplateIcon className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                    <h3 className="font-bold text-sm">{template.name}</h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4 flex-1">{template.description}</p>
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(template)}
                    aria-label={`Utiliser le template ${template.name}`}
                    className={cn(
                      'w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                      selectedTemplate === template.id
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                        : 'glass hover:bg-white/10'
                    )}
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" /> Utiliser
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </motion.section>

        {/* My sites */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          aria-labelledby="my-sites-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <Store className="w-5 h-5 text-blue-400" aria-hidden="true" />
            <h2 id="my-sites-title" className="text-xl font-bold">Mes sites</h2>
          </header>
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {sites.map((site) => (
              <li
                key={site.id}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-white/15 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg', site.gradient)}>
                      <Globe className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{site.name}</h3>
                      <p className="text-xs text-gray-400 font-mono">{site.url}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                      site.status === 'Publié' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                    )}
                  >
                    <span
                      className={cn('status-dot', site.status === 'Publié' ? 'active' : 'pending')}
                      aria-hidden="true"
                    />
                    {site.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-5 pb-5 border-b border-white/5">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="tabular-nums">{site.visits.toLocaleString('fr-FR')}</span> visites
                  </span>
                  {site.status === 'Publié' && (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                      En ligne
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleEdit(site)}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold glass hover:bg-white/10 transition-colors"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" /> Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVisit(site)}
                    aria-label={`Visiter ${site.name}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:scale-[1.02] transition-transform shadow-lg"
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" /> Visiter
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>
    </div>
  );
}
