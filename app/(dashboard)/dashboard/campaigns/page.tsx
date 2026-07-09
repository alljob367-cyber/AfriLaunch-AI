// AfriLaunch AI — Campagnes marketing module
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Megaphone, Sparkles, Play, Pause, Facebook, Youtube,
  Search, Mail, TrendingUp, DollarSign, Target, Zap,
  Rocket, Plus, type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

type CampaignStatus = 'Live' | 'En pause';
type Platform = 'Meta' | 'TikTok' | 'Google' | 'Email';

interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  budget: number;
  primaryMetric: { label: string; value: string };
  conversions: number;
  status: CampaignStatus;
}

interface CampaignStatusInfo {
  label: string;
  border: string;
  dot: string;
  badge: string;
}

const statusInfo: Record<CampaignStatus, CampaignStatusInfo> = {
  Live: {
    label: 'Live',
    border: 'border-l-green-500',
    dot: 'active',
    badge: 'bg-green-500/10 text-green-400',
  },
  'En pause': {
    label: 'En pause',
    border: 'border-l-amber-500',
    dot: 'pending',
    badge: 'bg-amber-500/10 text-amber-400',
  },
};

const platformConfig: Record<Platform, { icon: LucideIcon; gradient: string }> = {
  Meta: { icon: Facebook, gradient: 'from-blue-600 to-blue-700' },
  TikTok: { icon: Youtube, gradient: 'from-slate-700 to-black' },
  Google: { icon: Search, gradient: 'from-red-500 to-amber-500' },
  Email: { icon: Mail, gradient: 'from-orange-500 to-amber-600' },
};

const initialCampaigns: Campaign[] = [
  {
    id: 'c1',
    name: 'Promo Été 2024',
    platform: 'Meta',
    budget: 420,
    primaryMetric: { label: 'Impressions', value: '1 240' },
    conversions: 34,
    status: 'Live',
  },
  {
    id: 'c2',
    name: 'Lancement Collection',
    platform: 'TikTok',
    budget: 320,
    primaryMetric: { label: 'Impressions', value: '2 890' },
    conversions: 28,
    status: 'Live',
  },
  {
    id: 'c3',
    name: 'Newsletter Welcome',
    platform: 'Email',
    budget: 0,
    primaryMetric: { label: 'Envoyés', value: '1 240' },
    conversions: 89,
    status: 'En pause',
  },
];

const stats: { label: string; value: string; icon: LucideIcon; tint: string }[] = [
  { label: 'Campagnes actives', value: '3', icon: Rocket, tint: 'text-orange-400' },
  { label: 'Budget total', value: '$1 240', icon: DollarSign, tint: 'text-amber-400' },
  { label: 'ROI moyen', value: '3,2x', icon: TrendingUp, tint: 'text-emerald-400' },
  { label: 'Conversions', value: '89', icon: Target, tint: 'text-pink-400' },
];

export default function CampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [form, setForm] = useState<{ name: string; platform: Platform; budget: string }>({
    name: '',
    platform: 'Meta',
    budget: '',
  });

  const handleToggleStatus = (campaign: Campaign) => {
    const next: CampaignStatus = campaign.status === 'Live' ? 'En pause' : 'Live';
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaign.id ? { ...c, status: next } : c))
    );
    toast({
      title: next === 'Live' ? 'Campagne reprise' : 'Campagne mise en pause',
      description: `${campaign.name} est maintenant ${next === 'Live' ? 'en direct' : 'en pause'}.`,
      variant: next === 'Live' ? 'success' : 'warning',
    });
  };

  const handleOptimize = (campaign: Campaign) => {
    toast({
      title: 'Optimisation IA lancée',
      description: `L'Ads Agent analyse ${campaign.name} pour ajuster le ciblage et le budget.`,
      variant: 'success',
    });
  };

  const handleLaunch = () => {
    if (!form.name.trim()) {
      toast({
        title: 'Nom manquant',
        description: 'Donnez un nom à votre campagne avant de la lancer.',
        variant: 'warning',
      });
      return;
    }
    if (!form.budget.trim() || Number(form.budget) < 0) {
      toast({
        title: 'Budget invalide',
        description: 'Saisissez un budget valide (en dollars).',
        variant: 'warning',
      });
      return;
    }
    toast({
      title: 'Campagne créée et optimisée par l\'Ads Agent',
      description: `« ${form.name} » est prête sur ${form.platform} avec un budget de $${form.budget}.`,
      variant: 'success',
    });
    setForm({ name: '', platform: 'Meta', budget: '' });
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-amber-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Campagnes marketing"
          description="Lancez et pilotez vos publicités Meta, TikTok et Google Ads. L'IA optimise le ciblage et le budget automatiquement."
          icon={Megaphone}
          gradient="from-orange-500 to-amber-600"
          action={
            <button
              type="button"
              onClick={() => toast({ title: 'Rapport ROI', description: 'Génération du rapport PDF en cours…', variant: 'success' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold glass hover:bg-white/10 transition-colors"
            >
              <TrendingUp className="w-4 h-4" aria-hidden="true" /> Rapport ROI
            </button>
          }
        />

        {/* Stats row */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          aria-label="Statistiques des campagnes"
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

        {/* Active campaigns */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
          aria-labelledby="active-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <Rocket className="w-5 h-5 text-orange-400" aria-hidden="true" />
            <h2 id="active-title" className="text-xl font-bold">Campagnes actives</h2>
          </header>
          <ul className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {campaigns.map((campaign, i) => {
              const info = statusInfo[campaign.status];
              const PlatformIcon = platformConfig[campaign.platform].icon;
              return (
                <motion.li
                  key={campaign.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'glass rounded-2xl p-5 border border-white/5 border-l-4 transition-all duration-300 hover:bg-white/[0.03]',
                    info.border
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow', platformConfig[campaign.platform].gradient)}>
                        <PlatformIcon className="w-4.5 h-4.5 text-white" aria-hidden="true" />
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-md glass text-gray-300">{campaign.platform} Ads</span>
                    </div>
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', info.badge)}>
                      <span className={cn('status-dot', info.dot)} aria-hidden="true" />
                      {info.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-base mb-3">{campaign.name}</h3>

                  <dl className="grid grid-cols-3 gap-2 text-center mb-5 pb-5 border-b border-white/5">
                    <div>
                      <dt className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Budget</dt>
                      <dd className="text-sm font-bold tabular-nums">${campaign.budget}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{campaign.primaryMetric.label}</dt>
                      <dd className="text-sm font-bold tabular-nums">{campaign.primaryMetric.value}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Conv.</dt>
                      <dd className="text-sm font-bold tabular-nums text-emerald-400">{campaign.conversions}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleOptimize(campaign)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:scale-[1.02] transition-transform shadow-lg"
                    >
                      <Sparkles className="w-4 h-4" aria-hidden="true" /> Optimiser avec IA
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(campaign)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold glass hover:bg-white/10 transition-colors"
                    >
                      {campaign.status === 'Live' ? (
                        <><Pause className="w-4 h-4" aria-hidden="true" /> Mettre en pause</>
                      ) : (
                        <><Play className="w-4 h-4" aria-hidden="true" /> Reprendre</>
                      )}
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </motion.section>

        {/* Create campaign form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-premium"
          aria-labelledby="create-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <Plus className="w-5 h-5 text-orange-400" aria-hidden="true" />
            <h2 id="create-title" className="text-xl font-bold">Créer une campagne</h2>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label htmlFor="campaign-name" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Nom de la campagne
              </label>
              <input
                id="campaign-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex : Black Friday 2024"
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-orange-500/50 outline-none text-sm"
              />
            </div>
            <div>
              <label htmlFor="campaign-platform" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Plateforme
              </label>
              <select
                id="campaign-platform"
                value={form.platform}
                onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value as Platform }))}
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-orange-500/50 outline-none text-sm custom-scrollbar"
              >
                <option value="Meta">Meta Ads</option>
                <option value="TikTok">TikTok Ads</option>
                <option value="Google">Google Ads</option>
                <option value="Email">Email</option>
              </select>
            </div>
            <div>
              <label htmlFor="campaign-budget" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Budget ($)
              </label>
              <input
                id="campaign-budget"
                type="number"
                min="0"
                step="10"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                placeholder="500"
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-orange-500/50 outline-none text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleLaunch}
            className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:scale-[1.02] transition-transform shadow-lg"
          >
            <Zap className="w-4 h-4" aria-hidden="true" /> Lancer la campagne
          </button>
        </motion.section>
      </div>
    </div>
  );
}
