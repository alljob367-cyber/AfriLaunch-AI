// AfriLaunch AI — Organisation module (first-run create form)
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Rocket, Building2 } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';

const COUNTRIES = [
  { code: 'SN', label: 'Sénégal' },
  { code: 'CI', label: 'Côte d\'Ivoire' },
  { code: 'GH', label: 'Ghana' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'KE', label: 'Kenya' },
  { code: 'MA', label: 'Maroc' },
  { code: 'CM', label: 'Cameroun' },
  { code: 'BF', label: 'Burkina Faso' },
  { code: 'ML', label: 'Mali' },
  { code: 'BJ', label: 'Bénin' },
  { code: 'TG', label: 'Togo' },
  { code: 'CD', label: 'RD Congo' },
];

export default function OrganizationPage() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('SN');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: 'Nom requis',
        description: 'Donnez un nom à votre organisation pour continuer.',
        variant: 'error',
      });
      return;
    }
    setSubmitting(true);
    // In production: POST to /api/organizations
    await new Promise((r) => setTimeout(r, 800));
    toast({
      title: 'Organisation créée !',
      description: `"${name}" est prête. Bienvenue sur AfriLaunch AI 🎉`,
      variant: 'success',
    });
    setSubmitting(false);
    setName('');
    setDescription('');
    setCountry('SN');
  }

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-slate-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-gray-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-2xl mx-auto">
        <ModuleHeader
          title="Créer votre organisation"
          description="Donnez un nom à votre business pour débloquer tous les outils AfriLaunch AI."
          icon={Settings}
          gradient="from-slate-500 to-gray-600"
        />

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-6 border border-white/5 space-y-5"
          aria-labelledby="org-form-title"
        >
          <header className="flex items-center gap-3 pb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg">
              <Building2 className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 id="org-form-title" className="text-lg font-bold">Première étape</h2>
              <p className="text-xs text-gray-400">C&apos;est la première chose à configurer pour démarrer.</p>
            </div>
          </header>

          <div>
            <label htmlFor="org-name" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Nom de l&apos;organisation <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <input
              id="org-name"
              name="org-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Teranga Mode"
              className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/50 outline-none text-sm"
            />
          </div>

          <div>
            <label htmlFor="org-description" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Description
            </label>
            <textarea
              id="org-description"
              name="org-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Décrivez votre activité en une phrase (optionnel)…"
              className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/50 outline-none text-sm resize-y custom-scrollbar"
            />
          </div>

          <div>
            <label htmlFor="org-country" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Pays
            </label>
            <select
              id="org-country"
              name="org-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/50 outline-none text-sm custom-scrollbar"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-slate-500 to-gray-600 text-white hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-60 disabled:hover:scale-100"
          >
            <Rocket className="w-4 h-4" aria-hidden="true" />
            {submitting ? 'Création en cours…' : 'Créer mon organisation'}
          </button>

          <p className="text-center text-xs text-gray-500">
            Vous pourrez modifier ces informations à tout moment depuis les paramètres.
          </p>
        </motion.form>
      </div>
    </div>
  );
}
