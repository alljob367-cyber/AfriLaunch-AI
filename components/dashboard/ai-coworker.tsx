// AfriLaunch AI — AI Coworker Component
// Floating assistant that can interact with all modules via text or voice
// Uses Web Speech API for STT (speech-to-text) + ElevenLabs for TTS (text-to-speech)

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Mic, MicOff, Volume2, Bot, Loader2, Lock } from 'lucide-react';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import type { PlanId } from '@/lib/user-types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  audioUrl?: string;
}

// Module routing — the coworker understands which module the user wants
const MODULE_KEYWORDS: Record<string, { module: string; description: string }> = {
  'identité|logo|marque|branding|charte|palette|couleur': { module: 'identity', description: 'Identité de marque' },
  'site web|site|landing|boutique|website|page web': { module: 'website', description: 'Site web' },
  'contenu|post|instagram|tiktok|facebook|caption|newsletter|article|flyer': { module: 'content', description: 'Création de contenu' },
  'réseau|social|whatsapp|instagram|tiktok|linkedin|twitter|connecter': { module: 'social', description: 'Réseaux sociaux' },
  'agent|ia|bot|assistant|intelligence': { module: 'agents', description: 'Agents IA' },
  'paiement|payer|mobile money|mtn|orange|wave|fcfa|abonnement|plan': { module: 'subscription', description: 'Paiement & abonnement' },
  'parrain|filleul|invitation|referral': { module: 'referral', description: 'Parrainage' },
  'organisation|business|entreprise|profil': { module: 'organization', description: 'Organisation' },
  'voix|audio|parler|parle|voice|elevenlabs': { module: 'voice', description: 'Voix IA' },
  'annonce|pub|publicité|ad|facebook ad|google ad|youtube': { module: 'ads-inbox', description: 'Publicités & IA' },
  'analytic|statistique|stat|performance|métrique': { module: 'analytics', description: 'Analytics' },
};

// Intent detection for "create a logo / brand kit" — triggers real image generation
const BRAND_KIT_INTENT_PATTERNS = [
  /cr[ée]{1,2}[a-z\s]*logo/i,
  /cr[ée]{1,2}[a-z\s]*(kit|identité|charte)/i,
  /g[ée]n[èe]r[ée][a-z\s]*(logo|kit|charte|identité)/i,
  /fais[a-z\s]*(logo|kit|charte|identité)/i,
  /logo\s+pro/i,
  /kit\s+m[ée]dia/i,
  /kit\s+de\s+marque/i,
  /banni[èe]re\s+(r[ée]seau|facebook|instagram|linkedin)/i,
];

function isBrandKitIntent(text: string): boolean {
  return BRAND_KIT_INTENT_PATTERNS.some((p) => p.test(text));
}

function routeToModule(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [keywords, info] of Object.entries(MODULE_KEYWORDS)) {
    if (keywords.split('|').some((k) => lower.includes(k))) {
      return info.module;
    }
  }
  return null;
}

// Plans that can access the AI Coworker (Pro, Business, Enterprise)
const ALLOWED_PLANS: PlanId[] = ['pro', 'business', 'enterprise'];

export function AICoworker() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [hasMic, setHasMic] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check for Web Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        setHasMic(true);
        const recognition = new SR();
        recognition.lang = 'fr-FR';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
          // Auto-send after voice input
          setTimeout(() => handleSend(transcript), 300);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: '👋 Bonjour ! Je suis votre AI Coworker. Je peux vous aider avec tous les modules d\'AfriLaunch AI.\n\n📝 Écrivez ou 🎤 parlez (micro) — je peux aussi répondre en voix !\n\nExemples :\n• "Génère mon identité de marque"\n• "Crée un post Instagram"\n• "Connecte mon WhatsApp"\n• "Combien de crédits me reste-t-il ?"',
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [isOpen, messages.length]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast({ title: 'Micro non disponible', description: 'Votre navigateur ne supporte pas la reconnaissance vocale.', variant: 'warning' });
      return;
    }
    setIsListening(true);
    recognitionRef.current.start();
  }, [toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const speakResponse = useCallback((text: string) => {
    if (!speakEnabled) return;
    // Use Web Speech API (free, no API key, built into browser)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      // Try to find a French voice
      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find((v) => v.lang.startsWith('fr'));
      if (frVoice) utterance.voice = frVoice;
      window.speechSynthesis.speak(utterance);
    }
  }, [speakEnabled]);

  const handleSend = useCallback(async (text?: string) => {
    const message = (text || input).trim();
    if (!message || loading) return;

    const userMsg: Message = { role: 'user', content: message, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // ── Special intent: brand kit generation (logo + banners) ──────
      if (isBrandKitIntent(message)) {
        // Acknowledge immediately
        const ackMsg: Message = {
          role: 'assistant',
          content: '🎨 Je lance la génération de votre kit de marque complet (logo + bannières + favicon). Cela prend 2-3 minutes. Vous pouvez suivre la progression sur la page Identité de marque.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, ackMsg]);
        speakResponse(ackMsg.content);

        // Trigger the generation in the background
        try {
          const res = await fetch('/api/brand-kit/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({}), // pre-fills from organization server-side
          });
          const data = await res.json();
          if (data.ok) {
            const successMsg: Message = {
              role: 'assistant',
              content: `✅ Génération démarrée ! ${data.creditsUsed} crédits débités. ${data.creditsRemaining} crédits restants.\n\n👉 Suivez les livrables en temps réel sur /dashboard/identity`,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, successMsg]);
            speakResponse('Génération démarrée. Suivez les livrables sur la page identité de marque.');
          } else if (data.paymentRequired) {
            const errMsg: Message = {
              role: 'assistant',
              content: '🔒 Abonnement requis. Souscrivez un plan dans /dashboard/subscription pour générer votre kit de marque.',
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errMsg]);
          } else if (data.insufficientCredits) {
            const errMsg: Message = {
              role: 'assistant',
              content: `⚠️ Crédits insuffisants. La génération d'un kit coûte 15 crédits. Il vous reste ${data.creditsRemaining ?? 0} crédits.`,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errMsg]);
          } else {
            const errMsg: Message = {
              role: 'assistant',
              content: `⚠️ Échec: ${data.error || 'erreur inconnue'}`,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errMsg]);
          }
        } catch (err) {
          const errMsg: Message = {
            role: 'assistant',
            content: '⚠️ Erreur réseau lors du démarrage. Réessayez.',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errMsg]);
        }
        return;
      }

      // Route to the appropriate module
      const moduleRoute = routeToModule(message);

      // Build context-aware system prompt
      const systemPrompt = `Tu es l'AI Coworker d'AfriLaunch AI, un assistant intégré au dashboard. Tu aides l'utilisateur à naviguer et utiliser tous les modules.

${moduleRoute ? `L'utilisateur semble vouloir accéder au module: ${moduleRoute}` : ''}

Réponds en français, de façon concise (max 300 caractères). Si l'utilisateur demande une action spécifique, indique-lui sur quelle page aller.
Modules disponibles: identité de marque (/dashboard/identity), site web (/dashboard/website), contenu (/dashboard/content), réseaux sociaux (/dashboard/social), agents IA (/dashboard/agents), paiement (/dashboard/subscription), parrainage (/dashboard/referral), voix IA (/dashboard/voice), analytics (/dashboard/analytics), organisation (/dashboard/organization).`;

      // Call AI
      const res = await fetch('/api/ai/generate-async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'content',
          format: 'ad-copy',
          topic: message,
          businessName: 'AfriLaunch AI',
          tone: 'Amical',
        }),
      });
      const data = await res.json();

      let response = '';
      if (data.ok && data.jobId) {
        // Poll for result
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const pollRes = await fetch(`/api/ai/generate-async?jobId=${data.jobId}`, { credentials: 'include' });
          const pollData = await pollRes.json();
          if (pollData.status === 'done' && pollData.result?.content) {
            response = pollData.result.content;
            break;
          }
          if (pollData.status === 'failed') break;
        }
      }

      if (!response) {
        // Fallback response
        if (moduleRoute) {
          response = `Je vous redirige vers le module "${moduleRoute}". Allez sur /dashboard/${moduleRoute} pour continuer. 🚀`;
        } else {
          response = `Je peux vous aider avec : identité de marque, site web, contenu, réseaux sociaux, agents IA, paiements, et plus. Que souhaitez-vous faire ?`;
        }
      }

      const assistantMsg: Message = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, assistantMsg]);

      // Speak the response if enabled
      speakResponse(response);
    } catch (err) {
      const errorMsg: Message = {
        role: 'assistant',
        content: '⚠️ Désolé, une erreur est survenue. Réessayez dans un instant.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, speakResponse]);

  // Check if user has access (Pro, Business, Enterprise only)
  const userPlan = user?.plan as PlanId | undefined;
  const hasAccess = userPlan ? ALLOWED_PLANS.includes(userPlan) : false;
  const isAdmin = (user as any)?.isAdmin === true || (user as any)?.email === 'admin@albermon.com';

  const handleOpenCoworker = () => {
    if (!hasAccess && !isAdmin) {
      toast({
        title: '🔒 Plan requis',
        description: 'L\'AI Coworker est disponible à partir du plan Pro (15 000 FCFA/mois). Passez à Pro pour débloquer l\'assistant vocal.',
        variant: 'warning',
      });
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={handleOpenCoworker}
            className={cn(
              "fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform",
              (hasAccess || isAdmin)
                ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30"
                : "bg-gradient-to-br from-gray-600 to-gray-700 shadow-gray-500/20"
            )}
            aria-label="Ouvrir l'AI Coworker"
          >
            {(hasAccess || isAdmin) ? (
              <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
            ) : (
              <Lock className="w-5 h-5 text-gray-300" aria-hidden="true" />
            )}
            {(hasAccess || isAdmin) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-md h-[70vh] max-h-[600px] glass rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-sm">AI Coworker</p>
                  <p className="text-[10px] text-gray-500">Texte + Voix • Tous modules</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSpeakEnabled((v) => !v)}
                  aria-label={speakEnabled ? 'Désactiver la voix' : 'Activer la voix'}
                  className={cn('p-2 rounded-lg transition-colors', speakEnabled ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-500 hover:bg-white/5')}
                >
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fermer"
                  className="p-2 rounded-lg text-gray-400 hover:bg-white/5"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white'
                      : 'glass border border-white/5 text-gray-200'
                  )}>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" aria-hidden="true" />
                    <span className="text-xs text-gray-400">Réflexion...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {['🎨 Identité', '🌐 Site web', '✍️ Contenu', '📱 Réseaux', '🤖 Agents IA'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q.split(' ')[1])}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg glass border border-white/5 hover:bg-white/10 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                {hasMic && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    aria-label={isListening ? 'Arrêter l\'écoute' : 'Parler'}
                    className={cn(
                      'p-2.5 rounded-xl flex-shrink-0 transition-colors',
                      isListening ? 'bg-red-500 text-white animate-pulse' : 'glass text-gray-400 hover:text-white'
                    )}
                  >
                    {isListening ? <MicOff className="w-4 h-4" aria-hidden="true" /> : <Mic className="w-4 h-4" aria-hidden="true" />}
                  </button>
                )}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  placeholder={isListening ? 'Écoute en cours...' : 'Écrivez votre message...'}
                  disabled={loading || isListening}
                  className="flex-1 glass rounded-xl px-3 py-2.5 border border-white/5 focus:border-indigo-500/40 outline-none text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  aria-label="Envoyer"
                  className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white disabled:opacity-50 flex-shrink-0"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              {isListening && (
                <p className="text-[10px] text-red-400 text-center mt-1.5 animate-pulse">🎤 Parlez maintenant...</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
