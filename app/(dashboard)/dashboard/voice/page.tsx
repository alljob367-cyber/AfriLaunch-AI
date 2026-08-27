// AfriLaunch AI — Voix IA (ElevenLabs text-to-speech)
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mic, Loader2, Download, Send, AlertTriangle, Sparkles, Settings2,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

const MAX_CHARS = 5000;

interface VoiceResult {
  audioUrl: string;
  duration: number;
  voiceId: string;
  model: string;
}

export default function VoicePage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const charCount = text.length;
  const overLimit = charCount > MAX_CHARS;

  async function handleGenerate() {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Connectez-vous pour générer un message vocal.', variant: 'warning' });
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      toast({ title: 'Texte requis', description: 'Saisissez le texte à convertir en voix.', variant: 'warning' });
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      toast({ title: 'Texte trop long', description: `Maximum ${MAX_CHARS} caractères.`, variant: 'error' });
      return;
    }

    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const msg: string = data.error || 'Erreur serveur';
        if (/non configuré|Activez-le/i.test(msg)) {
          setNotConfigured(true);
        }
        toast({ title: 'Échec de la génération', description: msg, variant: 'error' });
        return;
      }
      setNotConfigured(false);
      setResult({
        audioUrl: data.audioUrl,
        duration: data.duration,
        voiceId: data.voiceId,
        model: data.model,
      });
      toast({ title: 'Message vocal généré ! 🎙️', description: `Durée estimée : ${data.duration}s`, variant: 'success' });
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.audioUrl;
    a.download = `afrilaunch-voix-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'Téléchargement MP3 lancé', variant: 'success' });
  }

  function handleWhatsApp() {
    toast({
      title: 'Bientôt disponible',
      description: 'Nécessite WhatsApp Business API.',
      variant: 'warning',
    });
  }

  function handleTelegram() {
    toast({
      title: 'Bientôt disponible',
      description: 'Nécessite le bot Telegram.',
      variant: 'warning',
    });
  }

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-pink-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-5xl mx-auto">
        <ModuleHeader
          title="Voix IA"
          description="Générez des messages vocaux avec l'IA ElevenLabs. Compatible WhatsApp et Telegram."
          icon={Mic}
          gradient="from-purple-500 to-pink-600"
        />

        {/* Not-configured warning */}
        {notConfigured && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium mb-6 border-amber-500/40"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-amber-300">ElevenLabs n'est pas configuré</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Activez ElevenLabs dans l'administration pour générer des messages vocaux.
                  Vous aurez besoin d'une clé API depuis{' '}
                  <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">
                    elevenlabs.io
                  </a>.
                </p>
                <button
                  type="button"
                  onClick={() => toast({ title: "Configuration requise", description: "Contactez votre administrateur pour activer ElevenLabs.", variant: "warning" })}
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-xs font-semibold hover:scale-105 transition-transform"
                >
                  <Settings2 className="w-3.5 h-3.5" aria-hidden="true" /> Configurer ElevenLabs
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="card-premium">
              <label htmlFor="voice-text" className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wide">
                Texte à convertir en voix
              </label>
              <textarea
                id="voice-text"
                rows={10}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex: Bonjour, c'est Teranga Mode ! Découvrez notre nouvelle collection wax premium disponible dès maintenant..."
                className={cn(
                  'w-full glass rounded-xl px-4 py-3 border outline-none text-sm resize-y placeholder:text-gray-600',
                  overLimit ? 'border-red-500/50' : 'border-white/5 focus:border-purple-500/40',
                )}
                aria-describedby="voice-char-count"
              />
              <div className="flex items-center justify-between mt-2">
                <span
                  id="voice-char-count"
                  className={cn('text-[11px]', overLimit ? 'text-red-400' : 'text-gray-500')}
                >
                  {charCount.toLocaleString('fr-FR')} / {MAX_CHARS.toLocaleString('fr-FR')} caractères
                </span>
                {overLimit && <span className="text-[11px] text-red-400">Limite dépassée</span>}
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !text.trim() || overLimit}
                className="mt-4 w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-500 to-pink-600 hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Génération en cours...</>
                ) : (
                  <><Sparkles className="w-4 h-4" aria-hidden="true" /> Générer la voix</>
                )}
              </button>

              {!user && <p className="text-xs text-amber-400 text-center mt-3">Connectez-vous pour générer</p>}
            </div>

            {/* Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-premium mt-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-purple-300" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Message vocal généré</h3>
                    <p className="text-[11px] text-gray-500">Durée estimée : {result.duration}s</p>
                  </div>
                </div>

                <audio controls src={result.audioUrl} className="w-full mb-4" preload="metadata">
                  Votre navigateur ne supporte pas la lecture audio.
                </audio>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:scale-[1.02] text-xs font-semibold transition-transform"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" /> Télécharger MP3
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" /> Envoyer sur WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={handleTelegram}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg glass border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" /> Envoyer sur Telegram
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar — voice settings */}
          <aside className="lg:col-span-1">
            <div className="card-premium sticky top-6">
              <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-purple-400" aria-hidden="true" />
                Paramètres voix
              </h2>
              <p className="text-[11px] text-gray-500 mb-4">
                Configurés par l'administrateur dans{' '}
                <button type="button" className="text-purple-400 underline">Admin → IA</button>.
                Affichés après une génération réussie.
              </p>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-gray-500">Voice ID</dt>
                  <dd className="font-mono text-xs text-gray-200 break-all">
                    {result?.voiceId ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-gray-500">Modèle</dt>
                  <dd className="font-mono text-xs text-gray-200 break-all">
                    {result?.model ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-gray-500">Stability</dt>
                  <dd className="text-xs text-gray-200">
                    {notConfigured ? 'Non configuré' : 'Configuré par l\'admin'}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 p-3 rounded-xl glass border border-white/5">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  💡 Les messages vocaux sont parfaits pour engager votre audience sur WhatsApp et
                  Telegram, où le taux d'ouverture dépasse 90 %.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
