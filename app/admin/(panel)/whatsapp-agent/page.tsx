// AfriLaunch AI — Admin > WhatsApp Agent (Twilio + ElevenLabs)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle, Phone, Loader2, RefreshCw, Check, AlertCircle,
  Sparkles, Send, Trash2, Bot,
} from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminToggle, AdminTextarea,
  SaveBar, LoadingState, StatusBadge, TestButton,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

export default function AdminWhatsAppAgentPage() {
  const { config, loading, saving, save, reload } = useConfig();
  const { toast } = useToast();
  const [draft, setDraft] = useState<typeof config>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [agentName, setAgentName] = useState('AfriLaunch WhatsApp Assistant');
  const [agentPrompt, setAgentPrompt] = useState('Tu es l\'assistant IA d\'AfriLaunch AI accessible via WhatsApp. Tu aides les entrepreneurs africains avec le marketing, le branding, les ventes et la croissance. Réponds en français, de façon concise et actionnable. Sois chaleureux et professionnel.');
  const [agentFirstMessage, setAgentFirstMessage] = useState('Bonjour 👋 Je suis votre assistant IA AfriLaunch. Comment puis-je vous aider aujourd\'hui ?');
  const [testMessage, setTestMessage] = useState('Bonjour, présentez-vous');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const fetchAgents = useCallback(async () => {
    setAgentsLoading(true);
    try {
      const res = await fetch('/api/whatsapp-agent/agents', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setAgents(data.agents || []);
    } catch { /* ignore */ }
    setAgentsLoading(false);
  }, []);

  useEffect(() => { if (config && !draft) setDraft(config); }, [config, draft]);
  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  if (loading || !draft || !config) return <LoadingState />;

  const dirty = JSON.stringify({ twilio: draft.twilio, elevenlabs: draft.elevenlabs }) !== JSON.stringify({ twilio: config.twilio, elevenlabs: config.elevenlabs });

  const update = (patch: Partial<NonNullable<typeof draft>['twilio']>) =>
    setDraft((prev) => prev ? { ...prev, twilio: { ...prev.twilio, ...patch } } : prev);
  const updateElevenlabs = (patch: Partial<NonNullable<typeof draft>['elevenlabs']>) =>
    setDraft((prev) => prev ? { ...prev, elevenlabs: { ...prev.elevenlabs, ...patch } } : prev);

  const handleSave = async () => {
    if (!draft) return;
    const ok = await save({ twilio: draft.twilio, elevenlabs: draft.elevenlabs });
    if (ok) setTimeout(() => fetchAgents(), 500);
  };

  async function handleCreateAgent() {
    setCreatingAgent(true);
    try {
      const res = await fetch('/api/whatsapp-agent/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: agentName,
          systemPrompt: agentPrompt,
          firstMessage: agentFirstMessage,
          voiceId: draft?.elevenlabs.voiceId || '',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: 'Agent créé ! 🤖', description: `ID: ${data.agent.agent_id}`, variant: 'success' });
        fetchAgents();
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' });
    } finally {
      setCreatingAgent(false);
    }
  }

  async function handleDeleteAgent(agentId: string) {
    try {
      const res = await fetch(`/api/whatsapp-agent/agents?agentId=${agentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: 'Agent supprimé', variant: 'warning' });
        fetchAgents();
      }
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' });
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResponse(null);
    try {
      const res = await fetch('/api/whatsapp-agent/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: testMessage }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestResponse(data.response);
        toast({ title: 'Réponse reçue !', variant: 'success' });
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' });
    } finally {
      setTesting(false);
    }
  }

  const webhookUrl = config.appUrl ? `${config.appUrl.replace(/\/$/, '')}/api/whatsapp-agent/webhook` : '';

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-green-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="WhatsApp Agent IA"
          description="Agent IA conversationnel sur WhatsApp via Twilio + ElevenLabs. Les utilisateurs discutent avec votre IA directement sur WhatsApp."
          icon={MessageCircle}
          color="from-green-500 to-emerald-600"
        />

        <div className="space-y-6">
          {/* Architecture overview */}
          <AdminCard title="Architecture" description="Comment ça marche">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-lg glass">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center"><MessageCircle className="w-4 h-4 text-green-400" aria-hidden="true" /></div>
                <div><p className="font-semibold">1. Utilisateur WhatsApp</p><p className="text-xs text-gray-500">Envoie un message à votre numéro Twilio</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg glass">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center"><Send className="w-4 h-4 text-orange-400" aria-hidden="true" /></div>
                <div><p className="font-semibold">2. Twilio Webhook</p><p className="text-xs text-gray-500">Transmet le message à notre serveur</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg glass">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center"><Bot className="w-4 h-4 text-violet-400" aria-hidden="true" /></div>
                <div><p className="font-semibold">3. ElevenLabs Agent IA</p><p className="text-xs text-gray-500">Génère une réponse intelligente (texte + voix)</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg glass">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center"><Check className="w-4 h-4 text-green-400" aria-hidden="true" /></div>
                <div><p className="font-semibold">4. Réponse WhatsApp</p><p className="text-xs text-gray-500">Envoyée automatiquement à l'utilisateur</p></div>
              </div>
            </div>
          </AdminCard>

          {/* Twilio config */}
          <AdminCard title="Configuration Twilio" description="Pont entre WhatsApp et l'IA" action={<StatusBadge ok={draft.twilio.enabled && !!draft.twilio.accountSid} />}>
            <div className="space-y-4">
              <AdminToggle
                label="Activer Twilio WhatsApp"
                description="Reçoit les messages WhatsApp et les transmet à l'IA"
                checked={draft.twilio.enabled}
                onChange={(v) => update({ enabled: v })}
              />
              <AdminInput
                label="Account SID"
                value={draft.twilio.accountSid}
                onChange={(v) => update({ accountSid: v })}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                hint="Depuis console.twilio.com → Account"
              />
              <AdminInput
                label="Auth Token"
                value={draft.twilio.authToken}
                onChange={(v) => update({ authToken: v })}
                secret
                placeholder="Votre auth token Twilio"
                hint="Depuis console.twilio.com → Account → API Keys"
              />
              <AdminInput
                label="Numéro WhatsApp Twilio"
                value={draft.twilio.whatsappNumber}
                onChange={(v) => update({ whatsappNumber: v })}
                placeholder="+1234567890"
                hint="Numéro WhatsApp Business Twilio (format international)"
              />
              {webhookUrl && (
                <div className="p-3 rounded-lg glass border border-blue-500/20 bg-blue-500/5">
                  <p className="text-xs font-semibold text-blue-300 mb-1">📌 URL Webhook Twilio</p>
                  <p className="text-xs font-mono break-all text-gray-400">{webhookUrl}</p>
                  <p className="text-[11px] text-gray-600 mt-1">Configurez cette URL dans Twilio Console → Messaging → Webhooks → "A MESSAGE COMES IN"</p>
                </div>
              )}
            </div>
          </AdminCard>

          {/* ElevenLabs config */}
          <AdminCard title="Configuration ElevenLabs" description="Voix IA + Agent conversationnel" action={<StatusBadge ok={draft.elevenlabs.enabled && !!draft.elevenlabs.apiKey} />}>
            <div className="space-y-4">
              <AdminToggle
                label="Activer ElevenLabs"
                checked={draft.elevenlabs.enabled}
                onChange={(v) => updateElevenlabs({ enabled: v })}
              />
              <AdminInput
                label="Clé API ElevenLabs"
                value={draft.elevenlabs.apiKey}
                onChange={(v) => updateElevenlabs({ apiKey: v })}
                secret
                placeholder="sk_xxxxxxxxxxxx"
                hint="Depuis elevenlabs.io → Profile → API Keys"
              />
              <AdminInput
                label="Voice ID"
                value={draft.elevenlabs.voiceId}
                onChange={(v) => updateElevenlabs({ voiceId: v })}
                placeholder="21m00Tcm4TlvDq8ikWAM"
                hint="ID de voix depuis elevenlabs.io → Voices"
              />
              {draft.twilio.elevenLabsAgentId && (
                <div className="p-3 rounded-lg glass border border-green-500/20">
                  <p className="text-xs font-semibold text-green-300 mb-1">✅ Agent connecté</p>
                  <p className="text-xs font-mono text-gray-400">{draft.twilio.elevenLabsAgentId}</p>
                </div>
              )}
            </div>
          </AdminCard>

          {/* Create ElevenLabs agent */}
          <AdminCard title="Créer un agent IA" description="Agent conversationnel ElevenLabs pour WhatsApp">
            <div className="space-y-4">
              <AdminInput
                label="Nom de l'agent"
                value={agentName}
                onChange={setAgentName}
                placeholder="AfriLaunch WhatsApp Assistant"
              />
              <AdminTextarea
                label="Prompt système (personnalité de l'IA)"
                value={agentPrompt}
                onChange={setAgentPrompt}
                rows={4}
                placeholder="Tu es l'assistant IA d'AfriLaunch AI..."
              />
              <AdminInput
                label="Premier message"
                value={agentFirstMessage}
                onChange={setAgentFirstMessage}
                placeholder="Bonjour 👋 Comment puis-je vous aider ?"
              />
              <button
                type="button"
                onClick={handleCreateAgent}
                disabled={creatingAgent || !draft.elevenlabs.apiKey}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:scale-[1.01] transition-transform shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {creatingAgent ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Sparkles className="w-4 h-4" aria-hidden="true" />}
                {creatingAgent ? 'Création...' : 'Créer l\'agent'}
              </button>
              {!draft.elevenlabs.apiKey && <p className="text-xs text-amber-400 text-center">Configurez la clé API ElevenLabs d'abord</p>}
            </div>
          </AdminCard>

          {/* Existing agents */}
          {agents.length > 0 && (
            <AdminCard title={`Agents ElevenLabs (${agents.length})`}>
              <div className="space-y-2">
                {agents.map((a) => (
                  <div key={a.agent_id} className="flex items-center justify-between p-3 rounded-lg glass">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center"><Bot className="w-4 h-4 text-violet-400" aria-hidden="true" /></div>
                      <div>
                        <p className="text-sm font-semibold">{a.name || 'Agent sans nom'}</p>
                        <p className="text-[10px] font-mono text-gray-500">{a.agent_id}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleDeleteAgent(a.agent_id)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </AdminCard>
          )}

          {/* Test */}
          <AdminCard title="Tester l'agent" description="Simulez une conversation WhatsApp">
            <div className="space-y-3">
              <AdminInput
                label="Message de test"
                value={testMessage}
                onChange={setTestMessage}
                placeholder="Bonjour, présentez-vous"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="w-full py-2.5 rounded-xl font-semibold text-sm glass border border-white/10 hover:bg-white/10 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
                {testing ? 'Traitement...' : 'Envoyer le test'}
              </button>
              {testResponse && (
                <div className="p-4 rounded-xl glass border border-green-500/20">
                  <p className="text-xs font-semibold text-green-300 mb-2">💬 Réponse de l'IA:</p>
                  <p className="text-sm text-gray-200 leading-relaxed">{testResponse}</p>
                </div>
              )}
            </div>
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
