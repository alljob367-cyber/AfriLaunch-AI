// AfriLaunch AI — Voix IA (Web Speech API — gratuit, illimité)
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Loader2, Play, Pause, Square, Send, Volume2 } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

const MAX_CHARS = 5000;

export default function VoicePage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);

  const charCount = text.length;
  const overLimit = charCount > MAX_CHARS;

  // Load available voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        setVoices(allVoices);
        // Default to first French voice
        const frVoice = allVoices.find((v) => v.lang.startsWith('fr'));
        if (frVoice) setSelectedVoice(frVoice.name);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const frVoices = voices.filter((v) => v.lang.startsWith('fr'));
  const otherVoices = voices.filter((v) => !v.lang.startsWith('fr'));

  function handleGenerate() {
    if (!user) {
      toast({ title: 'Connexion requise', variant: 'warning' });
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      toast({ title: 'Texte requis', variant: 'warning' });
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      toast({ title: 'Texte trop long', variant: 'error' });
      return;
    }

    setGenerating(true);

    // Use Web Speech API (free, no API key needed)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = 'fr-FR';
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Set selected voice
      if (selectedVoice) {
        const voice = voices.find((v) => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
      } else {
        const frVoice = voices.find((v) => v.lang.startsWith('fr'));
        if (frVoice) utterance.voice = frVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setGenerating(false);
      };
      utterance.onend = () => {
        setIsPlaying(false);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setGenerating(false);
        toast({ title: 'Erreur voix', description: 'Le navigateur n\'a pas pu lire le texte.', variant: 'error' });
      };

      window.speechSynthesis.speak(utterance);
      toast({ title: 'Voix générée ! 🎙️', description: 'Lecture en cours...', variant: 'success' });
    } else {
      setGenerating(false);
      toast({ title: 'Non supporté', description: 'Votre navigateur ne supporte pas la synthèse vocale.', variant: 'error' });
    }
  }

  function handleStop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }

  function handleReplay() {
    if (text.trim()) {
      handleGenerate();
    }
  }

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-3xl mx-auto">
        <ModuleHeader
          title="Voix IA"
          description="Générez des messages vocaux en français. Gratuit et illimité — utilise la synthèse vocale du navigateur."
          icon={Mic}
          gradient="from-purple-500 to-pink-600"
        />

        <div className="space-y-5">
          {/* Text input */}
          <div className="card-premium">
            <label htmlFor="voice-text" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
              Texte à convertir en voix
            </label>
            <textarea
              id="voice-text"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tapez votre texte ici... Ex: Bonjour, bienvenue sur AfriLaunch AI !"
              className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-purple-500/40 outline-none text-sm resize-y"
              maxLength={MAX_CHARS + 100}
            />
            <div className="flex items-center justify-between mt-2">
              <span className={cn('text-xs', overLimit ? 'text-red-400' : 'text-gray-500')}>
                {charCount} / {MAX_CHARS} caractères
              </span>
              <span className="text-[11px] text-green-400">✓ Gratuit • Illimité • Hors ligne</span>
            </div>
          </div>

          {/* Voice settings */}
          <div className="card-premium">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-purple-400" aria-hidden="true" />
              Paramètres vocaux
            </h3>
            <div className="space-y-3">
              {/* Voice selector */}
              <div>
                <label htmlFor="voice-select" className="text-xs font-semibold text-gray-400 mb-1 block">Voix</label>
                <select
                  id="voice-select"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-purple-500/40 outline-none text-sm bg-[#0a0a0f]"
                >
                  {frVoices.length > 0 && (
                    <optgroup label="🇫🇷 Français">
                      {frVoices.map((v) => <option key={v.name} value={v.name} className="bg-[#0a0a0f]">{v.name} ({v.lang})</option>)}
                    </optgroup>
                  )}
                  {otherVoices.length > 0 && (
                    <optgroup label="Autres langues">
                      {otherVoices.slice(0, 10).map((v) => <option key={v.name} value={v.name} className="bg-[#0a0a0f]">{v.name} ({v.lang})</option>)}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Rate */}
              <div>
                <label htmlFor="voice-rate" className="text-xs font-semibold text-gray-400 mb-1 block">
                  Vitesse: {rate.toFixed(1)}x
                </label>
                <input
                  id="voice-rate"
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              {/* Pitch */}
              <div>
                <label htmlFor="voice-pitch" className="text-xs font-semibold text-gray-400 mb-1 block">
                  Tonalité: {pitch.toFixed(1)}
                </label>
                <input
                  id="voice-pitch"
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !text.trim() || overLimit}
            className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-500 to-pink-600 hover:scale-[1.01] transition-transform shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Génération...</>
            ) : isPlaying ? (
              <><Volume2 className="w-4 h-4 animate-pulse" aria-hidden="true" /> Lecture en cours...</>
            ) : (
              <><Mic className="w-4 h-4" aria-hidden="true" /> Générer la voix</>
            )}
          </button>

          {/* Playback controls */}
          {isPlaying && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-white animate-pulse" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Lecture en cours</p>
                  <p className="text-xs text-gray-500">Synthèse vocale du navigateur</p>
                </div>
                <button type="button" onClick={handleStop} aria-label="Arrêter" className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30">
                  <Square className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Replay */}
          {!isPlaying && text.trim() && !generating && (
            <button
              type="button"
              onClick={handleReplay}
              className="w-full py-2.5 rounded-xl text-sm font-semibold glass border border-white/10 hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" aria-hidden="true" /> Réécouter
            </button>
          )}

          {/* Info */}
          <div className="glass rounded-2xl p-4 border border-green-500/20 bg-green-500/5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-4 h-4 text-green-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-300 mb-1">✓ Voix 100% gratuite</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Cette page utilise la synthèse vocale intégrée à votre navigateur (Web Speech API).
                  Aucune clé API requise, aucune limite, fonctionne hors ligne.
                  Qualité vocale dépendante du navigateur (Chrome = meilleure qualité).
                </p>
              </div>
            </div>
          </div>

          {/* Send to WhatsApp / Telegram (placeholder) */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => toast({ title: 'Bientôt disponible', description: 'Envoi WhatsApp nécessite Twilio configuré.', variant: 'warning' })}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold glass border border-white/10 hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" aria-hidden="true" /> Envoyer sur WhatsApp
            </button>
            <button
              type="button"
              onClick={() => toast({ title: 'Bientôt disponible', description: 'Envoi Telegram nécessite le bot configuré.', variant: 'warning' })}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold glass border border-white/10 hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" aria-hidden="true" /> Envoyer sur Telegram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
