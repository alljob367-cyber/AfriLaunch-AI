// AfriLaunch AI — WhatsApp Agent configuration (per-user)
// User can configure how the agent responds to THEIR customers
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageCircle, Sparkles, Loader2, Save, Send, Plus, Trash2, Clock,
  Bot, Building2, Phone, Languages, Volume2, AlertCircle, Check, Info,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

interface WhatsAppAgentConfig {
  userId: string;
  enabled: boolean;
  agentName: string;
  systemPrompt: string;
  tone: 'chaleureux' | 'professionnel' | 'decontracte' | 'formel';
  language: 'fr' | 'en' | 'bilingual';
  firstMessage: string;
  maxResponseLength: number;
  businessName: string;
  industry: string;
  country: string;
  services: string[];
  pricing: string;
  contactInfo: string;
  autoRespond: boolean;
  businessHours: {
    enabled: boolean;
    activeDays: number[];
    startTime: string;
    endTime: string;
    outsideHoursMessage: string;
  };
  faq: Array<{ id: string; question: string; answer: string }>;
  updatedAt: number;
}

const TONES = [
  { value: 'chaleureux', label: 'Chaleureux', desc: 'Accueillant, proche du client' },
  { value: 'professionnel', label: 'Professionnel', desc: 'Courtois, efficace' },
  { value: 'decontracte', label: 'Décontracté', desc: 'Amical, direct' },
  { value: 'formel', label: 'Formel', desc: 'Respectueux, précis' },
];

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'bilingual', label: 'Bilingue (auto)' },
];

const LENGTHS = [300, 500, 1000, 2000];

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
];

export default function WhatsAppAgentConfigPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [config, setConfig] = useState<WhatsAppAgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('Bonjour, présentez-vous');
  const [testReply, setTestReply] = useState<string | null>(null);
  const [newService, setNewService] = useState('');
  const [connectedWhatsApp, setConnectedWhatsApp] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp-agent/config', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setConfig(data.config);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const fetchWhatsApp = useCallback(async () => {
    try {
      const res = await fetch('/api/social/accounts', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        const wa = data.accounts.find((a: any) => a.platform === 'whatsapp' && a.connected);
        setConnectedWhatsApp(wa?.handle || null);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchWhatsApp();
  }, [fetchConfig, fetchWhatsApp]);

  const update = (updates: Partial<WhatsAppAgentConfig>) => {
    setConfig((prev) => prev ? { ...prev, ...updates } : prev);
  };

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/whatsapp-agent/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.ok) {
        setConfig(data.config);
        toast({ title: 'Configuration enregistrée ✅', variant: 'success' });
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!testMessage.trim() || !config) return;
    setTesting(true);
    setTestReply(null);
    try {
      const res = await fetch('/api/whatsapp-agent/config?action=test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: testMessage }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestReply(data.reply);
        toast({ title: 'Test réussi', variant: 'success' });
      } else {
        toast({ title: 'Échec test', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setTesting(false);
    }
  }

  function addService() {
    const s = newService.trim();
    if (!s || !config) return;
    update({ services: [...config.services, s] });
    setNewService('');
  }

  function removeService(idx: number) {
    if (!config) return;
    update({ services: config.services.filter((_, i) => i !== idx) });
  }

  function addFaq() {
    if (!config) return;
    update({
      faq: [...config.faq, {
        id: `faq_${Date.now()}`,
        question: '',
        answer: '',
      }],
    });
  }

  function updateFaq(id: string, field: 'question' | 'answer', value: string) {
    if (!config) return;
    update({
      faq: config.faq.map((f) => f.id === id ? { ...f, [field]: value } : f),
    });
  }

  function removeFaq(id: string) {
    if (!config) return;
    update({ faq: config.faq.filter((f) => f.id !== id) });
  }

  function toggleDay(day: number) {
    if (!config) return;
    const days = config.businessHours.activeDays;
    update({
      businessHours: {
        ...config.businessHours,
        activeDays: days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort(),
      },
    });
  }

  if (loading || !config) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-green-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <ModuleHeader
          title="Agent WhatsApp"
          description="Configurez comment l'IA répond à vos clients sur WhatsApp selon votre business."
          icon={MessageCircle}
          gradient="from-green-500 to-emerald-600"
          action={
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 transition-transform shadow-lg disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
              Enregistrer
            </button>
          }
        />

        {/* WhatsApp connection warning */}
        {!connectedWhatsApp && (
          <div className="mb-6 glass rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-amber-300 mb-1">WhatsApp non connecté</p>
                <p className="text-xs text-gray-400">
                  Pour activer l'agent sur votre numéro WhatsApp, connectez-le dans{' '}
                  <Link href="/dashboard/social" className="text-amber-300 underline">Réseaux sociaux</Link>.
                  L'agent répondra automatiquement aux messages reçus sur ce numéro.
                </p>
              </div>
            </div>
          </div>
        )}

        {connectedWhatsApp && (
          <div className="mb-6 glass rounded-2xl p-4 border border-green-500/30 bg-green-500/5">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-green-300">WhatsApp connecté : {connectedWhatsApp}</p>
                <p className="text-xs text-gray-400">L'agent répondra aux messages reçus sur ce numéro.</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Activation */}
          <section className="glass rounded-2xl p-5 border border-white/5">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-400" aria-hidden="true" />
              Activation
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold">Agent activé</p>
                  <p className="text-xs text-gray-500">Si activé, l'IA répond automatiquement aux messages WhatsApp.</p>
                </div>
                <button
                  type="button"
                  onClick={() => update({ enabled: !config.enabled })}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors flex-shrink-0',
                    config.enabled ? 'bg-green-500' : 'bg-gray-700',
                  )}
                  aria-pressed={config.enabled}
                >
                  <span className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                    config.enabled ? 'translate-x-6' : 'translate-x-0.5',
                  )} />
                </button>
              </label>
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold">Réponse automatique</p>
                  <p className="text-xs text-gray-500">Si désactivé, l'agent accuse réception mais ne répond pas (vous répondez manuellement).</p>
                </div>
                <button
                  type="button"
                  onClick={() => update({ autoRespond: !config.autoRespond })}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors flex-shrink-0',
                    config.autoRespond ? 'bg-green-500' : 'bg-gray-700',
                  )}
                  aria-pressed={config.autoRespond}
                >
                  <span className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                    config.autoRespond ? 'translate-x-6' : 'translate-x-0.5',
                  )} />
                </button>
              </label>
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">NOM DE L'AGENT</label>
                <input
                  type="text"
                  value={config.agentName}
                  onChange={(e) => update({ agentName: e.target.value })}
                  placeholder="Ex: Assistant Hotel Albermon"
                  className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-green-500/40 outline-none text-sm"
                />
              </div>
            </div>
          </section>

          {/* Personality */}
          <section className="glass rounded-2xl p-5 border border-white/5">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" aria-hidden="true" />
              Personnalité
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">TON</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => update({ tone: t.value as any })}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all',
                        config.tone === t.value
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-white/5 glass hover:bg-white/5',
                      )}
                    >
                      <p className="text-sm font-semibold">{t.label}</p>
                      <p className="text-[10px] text-gray-500">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block flex items-center gap-1">
                    <Languages className="w-3 h-3" aria-hidden="true" /> LANGUE
                  </label>
                  <select
                    value={config.language}
                    onChange={(e) => update({ language: e.target.value as any })}
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-green-500/40 outline-none text-sm"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value} className="bg-gray-900">{l.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">LONGUEUR MAX RÉPONSE</label>
                  <select
                    value={config.maxResponseLength}
                    onChange={(e) => update({ maxResponseLength: Number(e.target.value) })}
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-green-500/40 outline-none text-sm"
                  >
                    {LENGTHS.map((l) => (
                      <option key={l} value={l} className="bg-gray-900">{l} caractères</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">PREMIER MESSAGE (nouveau contact)</label>
                <textarea
                  value={config.firstMessage}
                  onChange={(e) => update({ firstMessage: e.target.value })}
                  rows={2}
                  placeholder="Bonjour 👋 Je suis l'assistant de {businessName}..."
                  className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-green-500/40 outline-none text-sm resize-none"
                />
                <p className="text-[10px] text-gray-600 mt-1">Utilisez <code className="text-gray-400">{'{businessName}'}</code> pour insérer le nom du business automatiquement.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">INSTRUCTIONS SPÉCIFIQUES (optionnel)</label>
                <textarea
                  value={config.systemPrompt}
                  onChange={(e) => update({ systemPrompt: e.target.value })}
                  rows={4}
                  placeholder="Ex: Toujours proposer une réservation. Ne jamais donner de prix par WhatsApp, demander d'appeler. Saluer en wolof si le client semble sénégalais..."
                  className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-green-500/40 outline-none text-sm resize-none"
                />
                <p className="text-[10px] text-gray-600 mt-1">Instructions libres que l'IA suivra en priorité.</p>
              </div>
            </div>
          </section>

          {/* Business context */}
          <section className="glass rounded-2xl p-5 border border-white/5">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" aria-hidden="true" />
              Contexte business
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Ces infos sont pré-remplies depuis votre <Link href="/dashboard/organization" className="text-blue-400 underline">organisation</Link>. Modifiez-les si nécessaire — l'agent les utilisera pour répondre.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">NOM DU BUSINESS</label>
                  <input
                    type="text"
                    value={config.businessName}
                    onChange={(e) => update({ businessName: e.target.value })}
                    placeholder="Ex: Hotel Albermon"
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-blue-500/40 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">INDUSTRIE</label>
                  <input
                    type="text"
                    value={config.industry}
                    onChange={(e) => update({ industry: e.target.value })}
                    placeholder="Ex: Hôtellerie, Restaurant, E-commerce..."
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-blue-500/40 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">SERVICES / PRODUITS</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService(); } }}
                    placeholder="Ex: Chambres doubles, Restaurant, Salle de conférence..."
                    className="flex-1 glass rounded-xl px-4 py-2 border border-white/5 focus:border-blue-500/40 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={addService}
                    className="px-3 rounded-xl glass border border-white/10 hover:bg-white/10"
                    aria-label="Ajouter"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                {config.services.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {config.services.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass border border-white/10 text-xs">
                        {s}
                        <button
                          type="button"
                          onClick={() => removeService(i)}
                          aria-label="Retirer"
                          className="text-gray-500 hover:text-red-400"
                        >
                          <X className="w-3 h-3" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">TARIFS (résumé rapide)</label>
                <textarea
                  value={config.pricing}
                  onChange={(e) => update({ pricing: e.target.value })}
                  rows={2}
                  placeholder="Ex: Chambre simple: 25 000 FCFA/nuit. Suite: 60 000 FCFA. Petit-déjeuner inclus."
                  className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-blue-500/40 outline-none text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block flex items-center gap-1">
                  <Phone className="w-3 h-3" aria-hidden="true" /> COORDONNÉES (à partager si demandé)
                </label>
                <input
                  type="text"
                  value={config.contactInfo}
                  onChange={(e) => update({ contactInfo: e.target.value })}
                  placeholder="Ex: +237 6XX XXX XXX · contact@business.com · Douala, Cameroun"
                  className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-blue-500/40 outline-none text-sm"
                />
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" aria-hidden="true" />
                FAQ personnalisée
              </h2>
              <button
                type="button"
                onClick={addFaq}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold glass border border-white/10 hover:bg-white/10"
              >
                <Plus className="w-3 h-3" aria-hidden="true" /> Ajouter
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              L'agent utilisera ces réponses si la question du client correspond. Idéal pour les questions fréquentes (horaires, adresse, tarifs...).
            </p>
            {config.faq.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-6">Aucune FAQ. Cliquez « Ajouter » pour créer une question/réponse.</p>
            ) : (
              <div className="space-y-3">
                {config.faq.map((entry) => (
                  <div key={entry.id} className="glass rounded-xl p-3 border border-white/5 space-y-2">
                    <div className="flex items-start gap-2">
                      <input
                        type="text"
                        value={entry.question}
                        onChange={(e) => updateFaq(entry.id, 'question', e.target.value)}
                        placeholder="Question (ex: Quels sont vos horaires ?)"
                        className="flex-1 glass rounded-lg px-3 py-2 border border-white/5 outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeFaq(entry.id)}
                        aria-label="Supprimer"
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                    <textarea
                      value={entry.answer}
                      onChange={(e) => updateFaq(entry.id, 'answer', e.target.value)}
                      rows={2}
                      placeholder="Réponse (ex: Nous sommes ouverts du lundi au samedi, de 8h à 20h.)"
                      className="w-full glass rounded-lg px-3 py-2 border border-white/5 outline-none text-sm resize-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Business hours */}
          <section className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" aria-hidden="true" />
                Heures d'ouverture
              </h2>
              <button
                type="button"
                onClick={() => update({ businessHours: { ...config.businessHours, enabled: !config.businessHours.enabled } })}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  config.businessHours.enabled ? 'bg-green-500' : 'bg-gray-700',
                )}
                aria-pressed={config.businessHours.enabled}
              >
                <span className={cn(
                  'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                  config.businessHours.enabled ? 'translate-x-6' : 'translate-x-0.5',
                )} />
              </button>
            </div>
            {config.businessHours.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">JOURS ACTIFS</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                          config.businessHours.activeDays.includes(d.value)
                            ? 'border-cyan-500 bg-cyan-500/10 text-white'
                            : 'border-white/5 glass text-gray-500 hover:text-white',
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">OUVERTURE</label>
                    <input
                      type="time"
                      value={config.businessHours.startTime}
                      onChange={(e) => update({ businessHours: { ...config.businessHours, startTime: e.target.value } })}
                      className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-cyan-500/40 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block">FERMETURE</label>
                    <input
                      type="time"
                      value={config.businessHours.endTime}
                      onChange={(e) => update({ businessHours: { ...config.businessHours, endTime: e.target.value } })}
                      className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-cyan-500/40 outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">MESSAGE HORS HORAIRES</label>
                  <textarea
                    value={config.businessHours.outsideHoursMessage}
                    onChange={(e) => update({ businessHours: { ...config.businessHours, outsideHoursMessage: e.target.value } })}
                    rows={2}
                    className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-cyan-500/40 outline-none text-sm resize-none"
                  />
                </div>
              </div>
            )}
            {!config.businessHours.enabled && (
              <p className="text-xs text-gray-500">L'agent répondra 24/7. Activez pour limiter aux heures d'ouverture.</p>
            )}
          </section>

          {/* Test */}
          <section className="glass rounded-2xl p-5 border border-white/5">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              Tester l'agent
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Simulez un message client pour voir comment l'agent répondrait avec votre configuration actuelle. Pensez à enregistrer avant de tester.
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleTest(); } }}
                placeholder="Ex: Bonjour, êtes-vous ouverts le dimanche ?"
                className="flex-1 glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-emerald-500/40 outline-none text-sm"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !testMessage.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-[1.02] transition-transform disabled:opacity-60"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
                Tester
              </button>
            </div>
            {testReply && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5"
              >
                <p className="text-xs font-semibold text-emerald-300 mb-2 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" aria-hidden="true" /> Réponse de l'agent
                </p>
                <p className="text-sm text-gray-100 whitespace-pre-wrap">{testReply}</p>
              </motion.div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// Local X icon (avoid importing again)
function X({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
