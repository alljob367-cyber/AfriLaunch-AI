// AfriLaunch AI — Créer votre organisation (persistance réelle + sync)
'use client';

import { useState, useEffect } from 'react';
import { Settings, Rocket, Loader2, Check, Building2, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { useOrganization } from '@/hooks/use-organization';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function OrganizationPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { organization, isLoading: orgLoading, refresh } = useOrganization();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('Cameroun');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form when org is loaded
  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setDescription(organization.description);
      setCountry(organization.country);
      setIndustry(organization.industry);
      setWebsite(organization.website);
      setEmail(organization.email);
      setPhone(organization.phone);
      setAddress(organization.address);
    } else if (user) {
      setEmail(user.email || '');
    }
  }, [organization, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Nom requis', description: 'Donnez un nom à votre organisation', variant: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description, country, industry, website, email, phone, address }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast({ title: 'Échec', description: data.error || 'Erreur', variant: 'error' });
        setSubmitting(false);
        return;
      }
      await refresh();
      toast({
        title: organization ? 'Organisation mise à jour ! ✓' : 'Organisation créée ! 🎉',
        description: 'Tous les modules sont maintenant débloqués et synchronisés.',
        variant: 'success',
      });
      if (!organization) {
        setTimeout(() => router.push('/dashboard'), 1000);
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  if (orgLoading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" aria-hidden="true" />
      </div>
    );
  }

  const isEditing = !!organization;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-slate-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-3xl mx-auto">
        <ModuleHeader
          title={isEditing ? 'Votre organisation' : 'Créer votre organisation'}
          description={isEditing
            ? 'Modifiez les informations de votre organisation. Tous les modules utilisent ces données.'
            : 'Créez votre organisation pour débloquer tous les outils : identité de marque, site web, agents IA, paiements et plus.'}
          icon={Settings}
          gradient="from-slate-500 to-gray-600"
        />

        {/* Success banner if org exists */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 glass rounded-2xl p-4 border border-green-500/30 bg-green-500/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-green-400">Organisation active ✓</p>
                <p className="text-xs text-gray-400">Tous les modules sont synchronisés avec "{organization.name}"</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              <Link href="/dashboard/identity" className="text-xs px-3 py-2 rounded-lg glass hover:bg-white/10 text-center transition-colors">🎨 Identité</Link>
              <Link href="/dashboard/website" className="text-xs px-3 py-2 rounded-lg glass hover:bg-white/10 text-center transition-colors">🌐 Site web</Link>
              <Link href="/dashboard/content" className="text-xs px-3 py-2 rounded-lg glass hover:bg-white/10 text-center transition-colors">✍️ Contenu</Link>
              <Link href="/dashboard/agents" className="text-xs px-3 py-2 rounded-lg glass hover:bg-white/10 text-center transition-colors">🤖 Agents IA</Link>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 border border-white/5 space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="org-name" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide flex items-center gap-1">
              <Building2 className="w-3 h-3" aria-hidden="true" /> Nom de l'organisation *
            </label>
            <input id="org-name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Hotel Albermon, Teranga Mode, Sahel Tech..."
              className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/40 outline-none text-sm" />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="org-desc" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">Description</label>
            <textarea id="org-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre business en 1-2 phrases..."
              className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/40 outline-none text-sm resize-y" />
          </div>

          {/* Industry + Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="org-industry" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">Industrie / Secteur</label>
              <select id="org-industry" value={industry} onChange={(e) => setIndustry(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/40 outline-none text-sm bg-[#0a0a0f]">
                <option value="">— Sélectionner —</option>
                {['Hôtellerie', 'Restauration', 'Mode', 'Tech / SaaS', 'E-commerce', 'Immobilier', 'Agriculture', 'Finance', 'Santé', 'Éducation', 'Transport', 'Marketing', 'Consulting', 'Autre'].map((i) => <option key={i} value={i} className="bg-[#0a0a0f]">{i}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="org-country" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">Pays</label>
              <select id="org-country" value={country} onChange={(e) => setCountry(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/40 outline-none text-sm bg-[#0a0a0f]">
                {['Cameroun', 'Sénégal', 'Côte d\'Ivoire', 'Ghana', 'Nigeria', 'Kenya', 'Maroc', 'Cameroun', 'Mali', 'Burkina Faso', 'Bénin', 'Togo', 'Guinée', 'Congo', 'Gabon', 'Madagascar'].map((c) => <option key={c} value={c} className="bg-[#0a0a0f]">{c}</option>)}
              </select>
            </div>
          </div>

          {/* Website */}
          <div>
            <label htmlFor="org-website" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide flex items-center gap-1">
              <Globe className="w-3 h-3" aria-hidden="true" /> Site web (optionnel)
            </label>
            <input id="org-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://votre-site.com"
              className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/40 outline-none text-sm" />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="org-email" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide flex items-center gap-1">
                <Mail className="w-3 h-3" aria-hidden="true" /> Email
              </label>
              <input id="org-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@organisation.com"
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/40 outline-none text-sm" />
            </div>
            <div>
              <label htmlFor="org-phone" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide flex items-center gap-1">
                <Phone className="w-3 h-3" aria-hidden="true" /> Téléphone
              </label>
              <input id="org-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/40 outline-none text-sm" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="org-address" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide flex items-center gap-1">
              <MapPin className="w-3 h-3" aria-hidden="true" /> Adresse (optionnel)
            </label>
            <input id="org-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Ville, quartier, rue..."
              className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-slate-500/40 outline-none text-sm" />
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-slate-600 to-gray-700 hover:scale-[1.01] transition-transform shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {isEditing ? 'Mise à jour...' : 'Création...'}</>
              : isEditing
                ? <><Check className="w-4 h-4" aria-hidden="true" /> Mettre à jour</>
                : <><Rocket className="w-4 h-4" aria-hidden="true" /> Créer mon organisation</>
            }
          </button>

          {!isEditing && (
            <p className="text-center text-xs text-gray-500">
              Une fois créée, votre organisation sera synchronisée avec tous les modules : identité, site web, contenu, agents IA, et plus.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
