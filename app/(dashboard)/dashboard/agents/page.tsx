// AfriLaunch AI — Agents IA module (fully functional chat with 13 agents)
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Loader2, Sparkles, ArrowLeft, Trash2, MessageSquare,
  Check, Link2, Zap,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { AGENTS, type Agent } from '@/lib/agents';
import { cn } from '@/lib/utils';

interface SocialAccount {
  id: string;
  platform: string;
  handle: string;
  connected: boolean;
}

interface ChatMessageUI {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

// Per-agent suggested prompts (clickable to start fast)
const SUGGESTED_PROMPTS: Record<string, string[]> = {
  branding: ['Crée un logo pour mon restaurant', 'Propose 5 noms de marque pour une startup fintech', 'Donne-moi une palette de couleurs panafricaine'],
  content: ['Écris un post Instagram pour lancer mon produit', 'Génère un script de Reel de 30s', 'Donne-moi 10 hashtags tendance ce mois-ci'],
  seo: ['Audit SEO de mon site en 5 points', 'Donne-moi 20 mots-clés pour mon industrie', 'Comment optimiser mon meta titre ?'],
  ads: ['Crée une campagne Meta Ads avec 50€/jour', 'Quels ciblages pour le marché camerounais ?', 'Donne-moi 3 variations d\'headline'],
  support: ['Rédige une FAQ pour mon e-commerce', 'Modèle de réponse pour client mécontent', 'Comment gérer une réclamation WhatsApp ?'],
  'analytics-agent': ['Quels KPIs suivre pour mon Instagram ?', 'Analyse mes 7 derniers jours de trafic', 'Pars du benchmark de mon industrie'],
  ecommerce: ['Optimise ma fiche produit', 'Stratégie de cross-sell pour ma boutique', 'Quels prix pratiquer en Afrique de l\'Ouest ?'],
  email: ['Rédige une newsletter de lancement', 'Séquence de 3 emails pour prospects froids', '10 objets d\'email à fort taux d\'ouverture'],
  video: ['Script TikTok 15s pour mon produit', 'Storyboard pour une vidéo corporate', '5 hooks viraux pour Reels'],
  localization: ['Traduis ce slogan en wolof', 'Adapte ce post pour le marché sénégalais', 'Traduis en swahili avec note culturelle'],
  dev: ['Code un webhook Stripe en Node.js', 'Intègre Flutterwave dans Next.js', 'Corrige ce bug React'],
  legal: ['Rédige mes CGV pour un e-commerce', 'Mentions légales pour mon site web', 'Contrat prestataire OHADA'],
  growth: ['Analyse mon marché en 3 questions', 'Roadmap de croissance 90 jours', 'Stratégies d\'acquisition low-budget'],
};

// Map agents → social platforms they can leverage when connected
const AGENT_PLATFORMS: Record<string, string[]> = {
  content: ['instagram', 'tiktok', 'facebook', 'twitter', 'whatsapp'],
  ads: ['facebook', 'instagram', 'tiktok'],
  video: ['tiktok', 'instagram', 'youtube'],
  support: ['whatsapp', 'instagram', 'facebook'],
  email: ['whatsapp'],
  ecommerce: ['instagram', 'facebook', 'whatsapp'],
};

export default function AgentsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loadingConv, setLoadingConv] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch connected social accounts (to show "auto-publish" badges)
  useEffect(() => {
    let mounted = true;
    fetch('/api/social/accounts', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (mounted && d.ok) setAccounts(d.accounts); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const connectedPlatforms = useMemo(
    () => new Set(accounts.filter((a) => a.connected).map((a) => a.platform)),
    [accounts],
  );

  // Load conversation when an agent is selected
  const loadConversation = useCallback(async (agentId: string) => {
    setLoadingConv(true);
    try {
      // We rely on the chat endpoint to persist; for instant UI, fetch the
      // last conversation by reading the conversations list and finding ours.
      const res = await fetch('/api/agents/conversations', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        const found = data.conversations.find((c: { agentId: string }) => c.agentId === agentId);
        if (found) {
          // We only have the last message preview — to get the full thread,
          // we'd need a dedicated endpoint. For now, show empty thread and
          // let user continue (history is sent to AI for context anyway).
          setMessages([]);
        } else {
          setMessages([]);
        }
      }
    } catch { /* ignore */ }
    setLoadingConv(false);
  }, []);

  const handleSelectAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setMessages([]);
    setInput('');
    loadConversation(agent.id);
  }, [loadConversation]);

  const handleBack = useCallback(() => {
    setSelectedAgent(null);
    setMessages([]);
    setInput('');
  }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || !selectedAgent || sending) return;

    const userMsg: ChatMessageUI = {
      id: 'u_' + Date.now(),
      role: 'user',
      content,
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId: selectedAgent.id, message: content }),
      });
      const data = await res.json();
      if (data.ok) {
        const aiMsg: ChatMessageUI = {
          id: 'a_' + Date.now(),
          role: 'assistant',
          content: data.reply,
          createdAt: Date.now(),
        };
        setMessages((m) => [...m, aiMsg]);
      } else {
        toast({ title: 'Erreur', description: data.error, variant: 'error' });
        // Remove the user message on failure
        setMessages((m) => m.filter((msg) => msg.id !== userMsg.id));
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
      setMessages((m) => m.filter((msg) => msg.id !== userMsg.id));
    } finally {
      setSending(false);
    }
  }

  const credits = (user as any)?.credits ?? null;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-indigo-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Agents IA"
          description="13 agents spécialisés pour automatiser votre business africain. Cliquez sur un agent pour démarrer une conversation."
          icon={Bot}
          gradient="from-indigo-500 to-violet-600"
        />

        {/* Credits bar */}
        {credits !== null && (
          <div className="mb-4 flex items-center gap-3 text-xs">
            <div className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-500" aria-hidden="true" />
              <span className="font-medium">{credits} crédits</span>
            </div>
            <span className="text-gray-500">· 1 crédit par message</span>
            {connectedPlatforms.size > 0 && (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" aria-hidden="true" />
                {connectedPlatforms.size} réseau(x) connecté(s)
              </span>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* AGENT GRID — visible when no agent selected */}
          {!selectedAgent && (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {AGENTS.map((agent, i) => {
                const platforms = AGENT_PLATFORMS[agent.id] ?? [];
                const connectedForAgent = platforms.filter((p) => connectedPlatforms.has(p));
                return (
                  <motion.button
                    key={agent.id}
                    type="button"
                    onClick={() => handleSelectAgent(agent)}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="text-left glass rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn(
                        'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0',
                        agent.color,
                      )}>
                        <Bot className="w-5 h-5 text-white" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{agent.name}</p>
                        <p className="text-xs text-gray-500 truncate">{agent.role}</p>
                      </div>
                      <Sparkles className="w-4 h-4 text-violet-400/60 group-hover:text-violet-400 transition-colors" aria-hidden="true" />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
                      {agent.description}
                    </p>
                    {connectedForAgent.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Link2 className="w-2.5 h-2.5" aria-hidden="true" />
                          {connectedForAgent.length} réseau(x)
                        </span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {/* CHAT VIEW — visible when an agent is selected */}
          {selectedAgent && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl border border-white/5 overflow-hidden flex flex-col"
              style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}
            >
              {/* Chat header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Retour à la liste"
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <div className={cn(
                  'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0',
                  selectedAgent.color,
                )}>
                  <Bot className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{selectedAgent.name}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedAgent.role} · /{selectedAgent.command}</p>
                </div>
                {(AGENT_PLATFORMS[selectedAgent.id] ?? [])
                  .filter((p) => connectedPlatforms.has(p)).length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Link2 className="w-2.5 h-2.5" aria-hidden="true" />
                    Réseaux liés
                  </span>
                )}
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {loadingConv && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" aria-hidden="true" />
                  </div>
                )}
                {!loadingConv && messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className={cn(
                      'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg mx-auto mb-4',
                      selectedAgent.color,
                    )}>
                      <Bot className="w-8 h-8 text-white" aria-hidden="true" />
                    </div>
                    <p className="font-semibold text-sm mb-1">{selectedAgent.name}</p>
                    <p className="text-xs text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
                      {selectedAgent.description}
                    </p>
                    {/* Suggested prompts */}
                    <div className="flex flex-col gap-2 max-w-md mx-auto">
                      {(SUGGESTED_PROMPTS[selectedAgent.id] ?? []).map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => sendMessage(prompt)}
                          className="text-left px-4 py-2.5 rounded-xl glass border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 text-xs text-gray-300 transition-all flex items-center gap-2"
                        >
                          <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" aria-hidden="true" />
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'assistant' && (
                      <div className={cn(
                        'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                        selectedAgent.color,
                      )}>
                        <Bot className="w-4 h-4 text-white" aria-hidden="true" />
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white'
                        : 'glass border border-white/5 text-gray-100',
                    )}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {sending && (
                  <div className="flex gap-3 justify-start">
                    <div className={cn(
                      'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                      selectedAgent.color,
                    )}>
                      <Bot className="w-4 h-4 text-white" aria-hidden="true" />
                    </div>
                    <div className="glass border border-white/5 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" aria-hidden="true" />
                      <span className="text-xs text-gray-400">L&apos;agent réfléchit…</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-end gap-2">
                  <div className="flex-1 glass rounded-xl px-4 py-2.5 border border-white/5 focus-within:border-violet-500/40 transition-colors">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder={`Parlez à ${selectedAgent.name}…`}
                      rows={1}
                      className="w-full bg-transparent outline-none text-sm resize-none max-h-32"
                      disabled={sending}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || sending}
                    aria-label="Envoyer"
                    className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1">
                  <MessageSquare className="w-2.5 h-2.5" aria-hidden="true" />
                  Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne · 1 crédit par message
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
