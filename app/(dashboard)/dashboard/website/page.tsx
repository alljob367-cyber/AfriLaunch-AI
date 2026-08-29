// AfriLaunch AI — Website Builder (wizard: config → generate → preview → publish)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Globe, Sparkles, Loader2, Download, Check, RefreshCw, Plus, Trash2,
  ArrowRight, ArrowLeft, Eye, ExternalLink, Settings, Share2,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import {
  type WebsiteConfig, type BusinessType, type ServiceItem,
  BUSINESS_TYPES, FIELD_LABELS, getBusinessTypeInfo,
} from '@/lib/website-builder';

const WIZARD_STEPS = [
  { id: 0, label: 'Type de business', icon: Settings },
  { id: 1, label: 'Infos business', icon: Globe },
  { id: 2, label: 'Services', icon: Sparkles },
  { id: 3, label: 'Réservation', icon: Check },
  { id: 4, label: 'Contact', icon: Share2 },
  { id: 5, label: 'Générer', icon: Eye },
];

export default function WebsiteBuilderPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<WebsiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [savedConfigs, setSavedConfigs] = useState<WebsiteConfig[]>([]);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/website-builder/config', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setSavedConfigs(data.configs);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfigs();
    // Start new config
    setConfig({
      id: 'wb_' + Date.now().toString(36),
      userId: user?.id || '',
      businessType: 'restaurant',
      businessName: '', tagline: '', description: '',
      industry: '', country: 'Cameroun',
      primaryColor: '#6366f1',
      services: [], pricingPlans: [],
      reservation: { enabled: true, type: 'whatsapp', fields: ['name','phone','date','time','guests'], buttonText: 'Réserver', whatsappNumber: '' },
      contactPhone: '', contactEmail: '', contactAddress: '', contactWhatsApp: '',
      gallery: [], createdAt: Date.now(), updatedAt: Date.now(),
    });
  }, [fetchConfigs, user?.id]);

  function update(patch: Partial<WebsiteConfig>) {
    setConfig((prev) => prev ? { ...prev, ...patch } : prev);
  }

  function updateReservation(patch: any) {
    setConfig((prev) => prev ? { ...prev, reservation: { ...prev.reservation, ...patch } } : prev);
  }

  async function handleGenerate() {
    if (!config) return;
    if (!config.businessName) {
      toast({ title: 'Nom requis', description: 'Entrez le nom de votre business.', variant: 'warning' });
      setStep(1);
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/website-builder/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...config, generate: true }),
      });
      const data = await res.json();
      if (data.ok && data.config?.generatedHtml) {
        setConfig(data.config);
        setPreviewHtml(data.config.generatedHtml);
        toast({ title: 'Site généré ! 🎉', description: 'Votre site est prêt. Prévisualisez-le ci-dessous.', variant: 'success' });
        await fetchConfigs();
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish() {
    if (!config?.generatedHtml) return;
    try {
      const res = await fetch('/api/sites/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ html: config.generatedHtml, title: config.businessName }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        toast({ title: 'Site publié ! 🌐', description: data.url, variant: 'success' });
      } else if (data.upgradeRequired) {
        toast({ title: 'Plan Business requis 🔒', description: 'Passez au plan Business pour publier.', variant: 'warning' });
      } else {
        toast({ title: 'Échec publication', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' });
    }
  }

  function addService() {
    if (!config) return;
    update({ services: [...config.services, { id: 'srv_' + Date.now(), name: '', description: '', price: '', imageEmoji: '✨' }] });
  }

  function updateService(id: string, patch: Partial<ServiceItem>) {
    if (!config) return;
    update({ services: config.services.map((s) => s.id === id ? { ...s, ...patch } : s) });
  }

  function removeService(id: string) {
    if (!config) return;
    update({ services: config.services.filter((s) => s.id !== id) });
  }

  function selectBusinessType(type: BusinessType) {
    const info = getBusinessTypeInfo(type);
    update({
      businessType: type,
      reservation: { ...config!.reservation, fields: info.defaultFields },
      services: config!.services.length === 0
        ? info.defaultServices.map((name, i) => ({ id: `srv_${Date.now()}_${i}`, name, description: '', price: '', imageEmoji: '✨' }))
        : config!.services,
    });
  }

  if (loading || !config) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const bizInfo = getBusinessTypeInfo(config.businessType);

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-5xl mx-auto">
        <ModuleHeader
          title="Créateur de site web"
          description="Configurez votre site étape par étape. L'IA génère un site fonctionnel avec réservation, services et tarifs réels."
          icon={Globe}
          gradient="from-blue-500 to-cyan-600"
        />

        {/* Wizard steps */}
        <div className="flex items-center justify-between mb-8 px-2">
          {WIZARD_STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              className="group flex flex-col items-center gap-1.5 flex-1"
            >
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all',
                i === step ? 'bg-blue-500 border-blue-400 text-white scale-110 shadow-lg shadow-blue-500/30'
                : i < step ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-white/20 text-gray-600 group-hover:border-white/40',
              )}>
                {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              </div>
              <span className={cn('text-[10px] hidden md:block', i === step ? 'text-white font-semibold' : 'text-gray-600')}>
                {s.label}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Business type */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Quel type de business ?</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {BUSINESS_TYPES.map((b) => (
                  <button
                    key={b.type}
                    type="button"
                    onClick={() => selectBusinessType(b.type)}
                    className={cn(
                      'glass rounded-2xl p-4 border text-left transition-all',
                      config.businessType === b.type ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 hover:border-white/15',
                    )}
                  >
                    <span className="text-3xl block mb-2">{b.emoji}</span>
                    <p className="font-bold text-sm">{b.label}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{b.description}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button type="button" onClick={() => setStep(1)} className="btn-primary-cmp">Continuer <ArrowRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Business info */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Informations business</h2>
              <div className="glass rounded-2xl p-5 border border-white/5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">NOM DU BUSINESS *</label>
                  <input type="text" value={config.businessName} onChange={(e) => update({ businessName: e.target.value })}
                    placeholder="Ex: Hotel Albermon" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-blue-500/40 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">SLOGAN (laissez vide pour auto-générer)</label>
                  <input type="text" value={config.tagline} onChange={(e) => update({ tagline: e.target.value })}
                    placeholder="Ex: L'excellence au cœur de Douala" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-blue-500/40 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">DESCRIPTION (laissez vide pour auto-générer)</label>
                  <textarea value={config.description} onChange={(e) => update({ description: e.target.value })} rows={2}
                    placeholder="Ex: Hôtel 3 étoiles avec restaurant, piscine et salle de conférence..." className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-blue-500/40 outline-none text-sm resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">INDUSTRIE</label>
                    <input type="text" value={config.industry} onChange={(e) => update({ industry: e.target.value })}
                      placeholder="Hôtellerie" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">PAYS</label>
                    <input type="text" value={config.country} onChange={(e) => update({ country: e.target.value })}
                      className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">COULEUR PRINCIPALE</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={config.primaryColor} onChange={(e) => update({ primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-xl border border-white/10 cursor-pointer" />
                    <input type="text" value={config.primaryColor} onChange={(e) => update({ primaryColor: e.target.value })}
                      className="flex-1 glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm font-mono" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setStep(0)} className="btn-secondary-cmp"><ArrowLeft className="w-4 h-4" /> Retour</button>
                <button type="button" onClick={() => setStep(2)} className="btn-primary-cmp">Continuer <ArrowRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Services */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{bizInfo.type === 'restaurant' ? 'Menu / Plats' : 'Services'}</h2>
                <button type="button" onClick={addService} className="btn-secondary-cmp"><Plus className="w-3.5 h-3.5" /> Ajouter</button>
              </div>
              <p className="text-xs text-gray-500">Configurez vos services/plats avec prix. Le bouton "Réserver" sera fonctionnel.</p>
              {config.services.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center">
                  <p className="text-sm text-gray-400 mb-3">Aucun service configuré</p>
                  <button type="button" onClick={addService} className="btn-primary-cmp"><Plus className="w-4 h-4" /> Ajouter un service</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {config.services.map((s) => (
                    <div key={s.id} className="glass rounded-xl p-3 border border-white/5 space-y-2">
                      <div className="flex items-start gap-3">
                        <input type="text" value={s.imageEmoji || ''} onChange={(e) => updateService(s.id, { imageEmoji: e.target.value })}
                          className="w-12 text-center glass rounded-lg px-2 py-2 border border-white/5 outline-none text-lg" maxLength={2} />
                        <input type="text" value={s.name} onChange={(e) => updateService(s.id, { name: e.target.value })}
                          placeholder="Nom (ex: Chambre Double Deluxe)" className="flex-1 glass rounded-lg px-3 py-2 border border-white/5 outline-none text-sm font-semibold" />
                        <input type="text" value={s.price} onChange={(e) => updateService(s.id, { price: e.target.value })}
                          placeholder="Prix (ex: 25 000 FCFA)" className="w-40 glass rounded-lg px-3 py-2 border border-white/5 outline-none text-sm" />
                        <button type="button" onClick={() => removeService(s.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <input type="text" value={s.description} onChange={(e) => updateService(s.id, { description: e.target.value })}
                        placeholder="Description courte (ex: Climatisée, TV, WiFi, petit-déjeuner inclus)" className="w-full glass rounded-lg px-3 py-2 border border-white/5 outline-none text-xs" />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary-cmp"><ArrowLeft className="w-4 h-4" /> Retour</button>
                <button type="button" onClick={() => setStep(3)} className="btn-primary-cmp">Continuer <ArrowRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Reservation */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Réservation / Contact</h2>
              <div className="glass rounded-2xl p-5 border border-white/5 space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div><p className="text-sm font-semibold">Activer la réservation</p><p className="text-[11px] text-gray-500">Bouton fonctionnel sur le site</p></div>
                  <button type="button" onClick={() => updateReservation({ enabled: !config.reservation.enabled })}
                    className={cn('relative w-11 h-6 rounded-full transition-colors', config.reservation.enabled ? 'bg-blue-500' : 'bg-gray-700')}>
                    <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform', config.reservation.enabled ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                </label>
                {config.reservation.enabled && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 mb-1.5 block">TYPE DE RÉSERVATION</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[{ v: 'whatsapp', l: 'WhatsApp' }, { v: 'phone', l: 'Téléphone' }, { v: 'email', l: 'Email' }].map((t) => (
                          <button key={t.v} type="button" onClick={() => updateReservation({ type: t.v as any })}
                            className={cn('py-2 rounded-lg text-xs font-semibold border', config.reservation.type === t.v ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 glass')}>
                            {t.l}
                          </button>
                        ))}
                      </div>
                    </div>
                    {config.reservation.type === 'whatsapp' && (
                      <div>
                        <label className="text-xs font-semibold text-gray-400 mb-1.5 block">NUMÉRO WHATSAPP</label>
                        <input type="text" value={config.reservation.whatsappNumber || ''} onChange={(e) => updateReservation({ whatsappNumber: e.target.value })}
                          placeholder="+237 6XX XXX XXX" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm" />
                      </div>
                    )}
                    {config.reservation.type === 'phone' && (
                      <div>
                        <label className="text-xs font-semibold text-gray-400 mb-1.5 block">NUMÉRO DE TÉLÉPHONE</label>
                        <input type="text" value={config.reservation.phoneNumber || ''} onChange={(e) => updateReservation({ phoneNumber: e.target.value })}
                          placeholder="+237 6XX XXX XXX" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm" />
                      </div>
                    )}
                    {config.reservation.type === 'email' && (
                      <div>
                        <label className="text-xs font-semibold text-gray-400 mb-1.5 block">EMAIL</label>
                        <input type="email" value={config.reservation.email || ''} onChange={(e) => updateReservation({ email: e.target.value })}
                          placeholder="contact@business.com" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm" />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-gray-400 mb-1.5 block">TEXTE DU BOUTON</label>
                      <input type="text" value={config.reservation.buttonText} onChange={(e) => updateReservation({ buttonText: e.target.value })}
                        className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 mb-1.5 block">CHAMPS DU FORMULAIRE</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(FIELD_LABELS).map(([key, field]) => (
                          <button key={key} type="button"
                            onClick={() => {
                              const fields = config.reservation.fields.includes(key)
                                ? config.reservation.fields.filter((f) => f !== key)
                                : [...config.reservation.fields, key];
                              updateReservation({ fields });
                            }}
                            className={cn('px-2.5 py-1 rounded-lg text-xs border', config.reservation.fields.includes(key) ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-gray-500')}>
                            {field.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary-cmp"><ArrowLeft className="w-4 h-4" /> Retour</button>
                <button type="button" onClick={() => setStep(4)} className="btn-primary-cmp">Continuer <ArrowRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Contact */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Coordonnées de contact</h2>
              <div className="glass rounded-2xl p-5 border border-white/5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">TÉLÉPHONE</label>
                    <input type="text" value={config.contactPhone} onChange={(e) => update({ contactPhone: e.target.value })}
                      placeholder="+237 6XX XXX XXX" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">EMAIL</label>
                    <input type="email" value={config.contactEmail} onChange={(e) => update({ contactEmail: e.target.value })}
                      placeholder="contact@business.com" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">ADRESSE</label>
                  <input type="text" value={config.contactAddress} onChange={(e) => update({ contactAddress: e.target.value })}
                    placeholder="Douala, Cameroun" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">WHATSAPP (si différent du téléphone)</label>
                  <input type="text" value={config.contactWhatsApp} onChange={(e) => update({ contactWhatsApp: e.target.value })}
                    placeholder="+237 6XX XXX XXX" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">INSTAGRAM</label>
                    <input type="text" value={config.socialInstagram || ''} onChange={(e) => update({ socialInstagram: e.target.value })}
                      placeholder="@username" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">FACEBOOK</label>
                    <input type="text" value={config.socialFacebook || ''} onChange={(e) => update({ socialFacebook: e.target.value })}
                      placeholder="Page URL" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">TIKTOK</label>
                    <input type="text" value={config.socialTikTok || ''} onChange={(e) => update({ socialTikTok: e.target.value })}
                      placeholder="@username" className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 outline-none text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setStep(3)} className="btn-secondary-cmp"><ArrowLeft className="w-4 h-4" /> Retour</button>
                <button type="button" onClick={() => setStep(5)} className="btn-primary-cmp">Générer le site <Sparkles className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Generate + Preview */}
          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Génération du site</h2>
              {!previewHtml ? (
                <div className="glass rounded-2xl p-8 text-center">
                  <Globe className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-400 mb-1">Tout est prêt !</p>
                  <p className="text-xs text-gray-600 mb-6">
                    {config.services.length} service(s) · Réservation {config.reservation.type} · {config.businessType}
                  </p>
                  <button type="button" onClick={handleGenerate} disabled={generating}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-600 hover:scale-105 transition-transform shadow-lg disabled:opacity-60">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generating ? 'Génération...' : 'Générer le site'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <button type="button" onClick={handleGenerate} disabled={generating}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold glass border border-white/10 hover:bg-white/10 disabled:opacity-60">
                      {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Régénérer
                    </button>
                    <button type="button" onClick={() => {
                      const w = window.open('', '_blank');
                      if (w) { w.document.open(); w.document.write(previewHtml); w.document.close(); }
                    }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold glass border border-white/10 hover:bg-white/10">
                      <ExternalLink className="w-3.5 h-3.5" /> Plein écran
                    </button>
                    <button type="button" onClick={() => {
                      const a = document.createElement('a');
                      a.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(previewHtml);
                      a.download = `${config.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-site.html`;
                      a.click();
                    }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold glass border border-white/10 hover:bg-white/10">
                      <Download className="w-3.5 h-3.5" /> Télécharger HTML
                    </button>
                    <button type="button" onClick={handlePublish}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-105 transition-transform ml-auto">
                      <Share2 className="w-3.5 h-3.5" /> Publier en ligne
                    </button>
                  </div>
                  <iframe srcDoc={previewHtml} sandbox="allow-scripts allow-same-origin"
                    className="w-full h-[600px] rounded-xl border border-white/10 bg-white" title="Aperçu du site" />
                </>
              )}
              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setStep(4)} className="btn-secondary-cmp"><ArrowLeft className="w-4 h-4" /> Retour</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved sites */}
        {savedConfigs.filter((c) => c.generatedHtml).length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-bold mb-3">Mes sites créés</h3>
            <div className="space-y-2">
              {savedConfigs.filter((c) => c.generatedHtml).map((c) => (
                <button key={c.id} type="button" onClick={() => { setConfig(c); setPreviewHtml(c.generatedHtml!); setStep(5); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl glass border border-white/5 hover:border-blue-500/30 text-left">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.businessName}</p>
                    <p className="text-[10px] text-gray-500">{c.services.length} services · {c.businessType} · {new Date(c.generatedAt || c.updatedAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className="text-[10px] text-emerald-400">✓ Généré</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
