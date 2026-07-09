// AfriLaunch AI — Organisation module
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Save, Building2, Globe, CreditCard, Check, Crown,
  Bell, Smartphone, FileText, ShieldAlert, type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface Preference {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  enabled: boolean;
}

const planFeatures = [
  '5 organisations',
  '13 agents IA',
  '5 000 crédits / mois',
  '100 GB de stockage',
];

export default function OrganizationPage() {
  const { toast } = useToast();
  const [orgName, setOrgName] = useState('Teranga Mode');
  const [description, setDescription] = useState('Boutique de mode africaine contemporaine basée à Dakar');
  const [website, setWebsite] = useState('https://teranga-mode.africa');
  const [country, setCountry] = useState('Sénégal');
  const [prefs, setPrefs] = useState<Preference[]>([
    { id: 'email', label: 'Notifications email', description: 'Recevez les alertes importantes par email.', icon: Bell, enabled: true },
    { id: 'push', label: 'Notifications push', description: 'Alertes en temps réel sur votre navigateur.', icon: Smartphone, enabled: true },
    { id: 'reports', label: 'Rapports hebdomadaires', description: 'Synthèse de votre activité chaque lundi.', icon: FileText, enabled: true },
    { id: 'data-sharing', label: 'Partage de données anonymisé', description: 'Aidez-nous à améliorer l\'IA AfriLaunch.', icon: ShieldAlert, enabled: false },
  ]);

  const handleSave = () => {
    toast({
      title: 'Modifications enregistrées',
      description: 'Le profil de votre organisation a été mis à jour.',
      variant: 'success',
    });
  };

  const handleTogglePref = (id: string) => {
    setPrefs((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
    const pref = prefs.find((p) => p.id === id);
    if (pref) {
      toast({
        title: `${pref.label} ${pref.enabled ? 'désactivé' : 'activé'}`,
        variant: pref.enabled ? 'warning' : 'success',
      });
    }
  };

  const handleChangePlan = () => {
    toast({
      title: 'Redirection vers les tarifs',
      description: 'Ouverture de la page des formules AfriLaunch AI.',
      variant: 'success',
    });
  };

  const handleCancel = () => {
    toast({
      title: 'Confirmation requise',
      description: 'La résiliation prendra effet à la fin de la période en cours. Confirmez votre choix.',
      variant: 'warning',
    });
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-slate-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-gray-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Organisation"
          description="Gérez les informations de votre organisation, votre abonnement et vos préférences."
          icon={Settings}
          gradient="from-slate-500 to-gray-600"
          action={
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-slate-500 to-gray-600 hover:scale-105 transition-transform shadow-lg"
            >
              <Save className="w-4 h-4" aria-hidden="true" /> Enregistrer
            </button>
          }
        />

        {/* Organization profile */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium mb-10"
          aria-labelledby="profile-title"
        >
          <header className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-slate-400" aria-hidden="true" />
            <h2 id="profile-title" className="text-xl font-bold">Profil de l&apos;organisation</h2>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="org-name" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Nom de l&apos;organisation
              </label>
              <input
                id="org-name"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/50 outline-none text-sm"
              />
            </div>
            <div>
              <label htmlFor="org-website" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Site web
              </label>
              <input
                id="org-website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/50 outline-none text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="org-description" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Description
              </label>
              <textarea
                id="org-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/50 outline-none text-sm resize-y custom-scrollbar"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="org-country" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Pays
              </label>
              <select
                id="org-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/50 outline-none text-sm custom-scrollbar"
              >
                <option value="Sénégal">Sénégal</option>
                <option value="Côte d'Ivoire">Côte d&apos;Ivoire</option>
                <option value="Ghana">Ghana</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Kenya">Kenya</option>
                <option value="Maroc">Maroc</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-slate-500 to-gray-600 hover:scale-[1.02] transition-transform shadow-lg"
          >
            <Save className="w-4 h-4" aria-hidden="true" /> Enregistrer
          </button>
        </motion.section>

        {/* Subscription */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium mb-10"
          aria-labelledby="plan-title"
        >
          <header className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-slate-400" aria-hidden="true" />
            <h2 id="plan-title" className="text-xl font-bold">Abonnement</h2>
          </header>
          <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg">
                <Crown className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">Plan Pro</h3>
                  <span className="badge-new">Actuel</span>
                </div>
                <p className="text-sm text-gray-400">$29,99 / mois · prochaine facture le 15 août 2025</p>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-2 text-sm text-gray-300 flex-1">
              {planFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={handleChangePlan}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-slate-500 to-gray-600 hover:scale-[1.02] transition-transform shadow-lg"
            >
              <CreditCard className="w-4 h-4" aria-hidden="true" /> Changer de plan
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <ShieldAlert className="w-4 h-4" aria-hidden="true" /> Résilier
            </button>
          </div>
        </motion.section>

        {/* Preferences */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          aria-labelledby="prefs-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <Globe className="w-5 h-5 text-slate-400" aria-hidden="true" />
            <h2 id="prefs-title" className="text-xl font-bold">Préférences</h2>
          </header>
          <ul className="space-y-3">
            {prefs.map((pref, i) => (
              <motion.li
                key={pref.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-4 border border-white/5 hover:border-white/15 transition-all duration-300 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center flex-shrink-0">
                  <pref.icon className="w-5 h-5 text-slate-400" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{pref.label}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{pref.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref(pref.id)}
                  aria-pressed={pref.enabled}
                  aria-label={`${pref.enabled ? 'Désactiver' : 'Activer'} : ${pref.label}`}
                  className={cn('relative w-11 h-6 rounded-full transition-colors flex-shrink-0', pref.enabled ? 'bg-green-500' : 'bg-gray-700')}
                >
                  <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform', pref.enabled ? 'translate-x-5' : 'translate-x-0.5')} />
                </button>
              </motion.li>
            ))}
          </ul>
        </motion.section>
      </div>
    </div>
  );
}
