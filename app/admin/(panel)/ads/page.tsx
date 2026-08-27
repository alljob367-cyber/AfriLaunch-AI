// AfriLaunch AI — Admin > Publicités & IA (Facebook, Google, YouTube Ads)
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Megaphone, Facebook, Youtube, Chrome, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminToggle, AdminSelect,
  AdminNumber, SaveBar, LoadingState, StatusBadge, TestButton,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';
import { useToast } from '@/components/providers/toast-provider';
import type { AppConfig } from '@/lib/config-store';

export default function AdminAdsPage() {
  const { config, loading, saving, save } = useConfig();
  const { toast } = useToast();
  const [draft, setDraft] = useState<AppConfig | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (config && !draft) setDraft(config);
  }, [config, draft]);

  const dirty = useMemo(() => {
    if (!draft || !config) return false;
    return JSON.stringify(draft.ads) !== JSON.stringify(config.ads);
  }, [draft, config]);

  if (loading || !draft || !config) return <LoadingState />;

  const updateAds = (patch: Partial<AppConfig['ads']>) =>
    setDraft({ ...draft, ads: { ...draft.ads, ...patch } });
  const updateFb = (patch: Partial<AppConfig['ads']['facebook']>) =>
    updateAds({ facebook: { ...draft.ads.facebook, ...patch } });
  const updateGoogle = (patch: Partial<AppConfig['ads']['google']>) =>
    updateAds({ google: { ...draft.ads.google, ...patch } });
  const updateYt = (patch: Partial<AppConfig['ads']['youtube']>) =>
    updateAds({ youtube: { ...draft.ads.youtube, ...patch } });

  const handleSave = async () => {
    await save({ ads: draft.ads });
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast({ title: 'Copié', description: 'Copié dans le presse-papiers', variant: 'success' });
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {
      toast({ title: 'Échec copie', description: 'Impossible de copier', variant: 'error' });
    }
  };

  const fbWebhookUrl = `${config.appUrl}/api/ads/facebook/webhook`;
  const googleWebhookUrl = `${config.appUrl}/api/ads/google/webhook?secret=${draft.ads.google.leadFormWebhookSecret}`;
  const ytWebhookUrl = draft.ads.youtube.pubsubhubbubCallbackUrl || `${config.appUrl}/api/ads/youtube/webhook`;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl animate-aurora" aria-hidden="true" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-amber-500/8 blur-3xl animate-aurora delay-300" aria-hidden="true" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="Publicités & IA"
          description="Configurez Facebook Ads, Google Ads et YouTube Ads. L'IA répond automatiquement aux commentaires et messages de vos pubs."
          icon={Megaphone}
          color="from-orange-500 to-amber-600"
        />

        <div className="space-y-6">
          {/* Auto-réponse IA — Master card */}
          <AdminCard
            title="Auto-réponse IA"
            description="L'IA génère et publie des réponses automatiques aux commentaires, messages et leads"
            action={
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" aria-hidden="true" />
                <StatusBadge ok={draft.ads.autoRespond} label={draft.ads.autoRespond ? 'IA active' : 'IA désactivée'} />
              </div>
            }
          >
            <div className="space-y-4">
              <AdminToggle
                label="Auto-réponse activée"
                description="Active la génération IA pour tous les messages entrants (Facebook, Google, YouTube)"
                checked={draft.ads.autoRespond}
                onChange={(v) => updateAds({ autoRespond: v })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminSelect
                  label="Ton de réponse"
                  value={draft.ads.autoRespondTone}
                  onChange={(v) => updateAds({ autoRespondTone: v as AppConfig['ads']['autoRespondTone'] })}
                  options={[
                    { value: 'professional', label: 'Professionnel — courtois et informatif' },
                    { value: 'friendly', label: 'Amical — chaleureux et accueillant' },
                    { value: 'casual', label: 'Décontracté — conversationnel' },
                    { value: 'sales', label: 'Commercial — orienté conversion' },
                  ]}
                  hint="Le style adopté par l'IA pour formuler les réponses"
                />
                <AdminNumber
                  label="Délai de réponse (secondes)"
                  value={draft.ads.autoRespondDelaySeconds}
                  onChange={(v) => updateAds({ autoRespondDelaySeconds: v })}
                  min={0}
                  max={300}
                  step={5}
                  hint="Délai simulé avant réponse (plus naturel pour l'utilisateur)"
                />
              </div>
            </div>
          </AdminCard>

          {/* Facebook Ads */}
          <AdminCard
            title="Facebook Ads"
            description="Page Facebook + Messenger pour auto-répondre aux commentaires et messages privés"
            action={
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center" aria-hidden="true">
                  <Facebook className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <StatusBadge ok={draft.ads.facebook.enabled} />
              </div>
            }
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer Facebook Ads"
                description="Active la réception des webhooks et l'auto-réponse"
                checked={draft.ads.facebook.enabled}
                onChange={(v) => updateFb({ enabled: v })}
              />
              <AdminInput
                label="Page Access Token"
                value={draft.ads.facebook.pageAccessToken}
                onChange={(v) => updateFb({ pageAccessToken: v })}
                secret
                placeholder="EAAG..."
                hint="Token d'accès Page depuis Facebook Business"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminInput
                  label="Page ID"
                  value={draft.ads.facebook.pageId}
                  onChange={(v) => updateFb({ pageId: v })}
                  placeholder="123456789012345"
                  hint="ID de votre Page Facebook"
                />
                <AdminInput
                  label="App ID"
                  value={draft.ads.facebook.appId}
                  onChange={(v) => updateFb({ appId: v })}
                  placeholder="987654321098765"
                />
              </div>
              <AdminInput
                label="App Secret"
                value={draft.ads.facebook.appSecret}
                onChange={(v) => updateFb({ appSecret: v })}
                secret
                placeholder="abc123def456..."
              />

              {/* Verify token (read-only) */}
              <div>
                <label htmlFor="fb-verify-token" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                  Verify Token (généré)
                </label>
                <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 border border-white/5">
                  <input
                    id="fb-verify-token"
                    type="text"
                    readOnly
                    value={draft.ads.facebook.verifyToken}
                    className="bg-transparent flex-1 outline-none text-sm font-mono text-gray-300"
                    aria-readonly="true"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(draft.ads.facebook.verifyToken, 'fb-verify')}
                    className="text-xs text-gray-500 hover:text-white inline-flex items-center gap-1"
                    aria-label="Copier le verify token Facebook"
                  >
                    {copiedKey === 'fb-verify' ? <Check className="w-3.5 h-3.5 text-green-400" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                    Copier
                  </button>
                </div>
                <p className="text-[11px] text-gray-600 mt-1">À utiliser dans le webhook Facebook</p>
              </div>

              {/* Webhook URL */}
              <WebhookUrlBox url={fbWebhookUrl} onCopy={() => copyToClipboard(fbWebhookUrl, 'fb-webhook')} copied={copiedKey === 'fb-webhook'} hint="Configurez ce webhook dans Facebook App Dashboard → Webhooks" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <AdminToggle
                  label="Répondre aux messages privés"
                  description="Auto-répondre dans Messenger DM"
                  checked={draft.ads.facebook.autoReplyPrivateMessage}
                  onChange={(v) => updateFb({ autoReplyPrivateMessage: v })}
                />
                <AdminToggle
                  label="Répondre aux commentaires publics"
                  description="Auto-répondre en commentaire sur la pub"
                  checked={draft.ads.facebook.autoReplyComment}
                  onChange={(v) => updateFb({ autoReplyComment: v })}
                />
              </div>

              <div className="pt-2">
                <TestButton
                  label="Tester Facebook"
                  onTest={async () => {
                    try {
                      const r = await fetch('/api/ads/inbox?platform=facebook', { credentials: 'include' });
                      if (!r.ok) {
                        const d = await r.json().catch(() => ({}));
                        return { ok: false, message: d.error || `HTTP ${r.status}` };
                      }
                      const d = await r.json();
                      return { ok: true, message: `${d.count ?? 0} éléments Facebook récupérés` };
                    } catch (err) {
                      return { ok: false, message: (err as Error).message };
                    }
                  }}
                />
              </div>
            </div>
          </AdminCard>

          {/* Google Ads */}
          <AdminCard
            title="Google Ads"
            description="Lead Form Extensions + Google Ads API pour capturer et traiter les leads"
            action={
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-blue-500 flex items-center justify-center" aria-hidden="true">
                  <Chrome className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <StatusBadge ok={draft.ads.google.enabled} />
              </div>
            }
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer Google Ads"
                description="Active la réception des leads via webhook"
                checked={draft.ads.google.enabled}
                onChange={(v) => updateGoogle({ enabled: v })}
              />
              <AdminInput
                label="Developer Token"
                value={draft.ads.google.developerToken}
                onChange={(v) => updateGoogle({ developerToken: v })}
                secret
                placeholder="1a2B3c4D5e6F..."
                hint="Depuis Google Ads API Center"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminInput
                  label="Client ID"
                  value={draft.ads.google.clientId}
                  onChange={(v) => updateGoogle({ clientId: v })}
                  placeholder="xxxx.apps.googleusercontent.com"
                />
                <AdminInput
                  label="Client Secret"
                  value={draft.ads.google.clientSecret}
                  onChange={(v) => updateGoogle({ clientSecret: v })}
                  secret
                  placeholder="GOCSPX-..."
                />
              </div>
              <AdminInput
                label="Refresh Token"
                value={draft.ads.google.refreshToken}
                onChange={(v) => updateGoogle({ refreshToken: v })}
                secret
                placeholder="1//0eXXXX..."
              />
              <AdminInput
                label="Customer ID"
                value={draft.ads.google.customerId}
                onChange={(v) => updateGoogle({ customerId: v })}
                placeholder="123-456-7890"
                hint="Format: 123-456-7890"
              />

              {/* Lead form webhook secret (read-only) */}
              <div>
                <label htmlFor="g-webhook-secret" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                  Lead Form Webhook Secret (généré)
                </label>
                <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 border border-white/5">
                  <input
                    id="g-webhook-secret"
                    type="text"
                    readOnly
                    value={draft.ads.google.leadFormWebhookSecret}
                    className="bg-transparent flex-1 outline-none text-sm font-mono text-gray-300"
                    aria-readonly="true"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(draft.ads.google.leadFormWebhookSecret, 'g-secret')}
                    className="text-xs text-gray-500 hover:text-white inline-flex items-center gap-1"
                    aria-label="Copier le secret Google Ads"
                  >
                    {copiedKey === 'g-secret' ? <Check className="w-3.5 h-3.5 text-green-400" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                    Copier
                  </button>
                </div>
                <p className="text-[11px] text-gray-600 mt-1">Secret intégré à l'URL webhook — ne partagez jamais cette valeur publiquement</p>
              </div>

              <WebhookUrlBox
                url={googleWebhookUrl}
                onCopy={() => copyToClipboard(googleWebhookUrl, 'g-webhook')}
                copied={copiedKey === 'g-webhook'}
                hint="Configurez ce webhook dans Google Ads → Extensions de formulaire → Webhook"
              />

              <div className="pt-2">
                <AdminToggle
                  label="Envoyer email automatique aux leads"
                  description="Envoie un email de bienvenue/confirmation à chaque lead reçu"
                  checked={draft.ads.google.autoEmailLead}
                  onChange={(v) => updateGoogle({ autoEmailLead: v })}
                />
              </div>
            </div>
          </AdminCard>

          {/* YouTube Ads */}
          <AdminCard
            title="YouTube Ads"
            description="Auto-réponse aux commentaires sous vos vidéos publicitaires via PubSubHubbub"
            action={
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center" aria-hidden="true">
                  <Youtube className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <StatusBadge ok={draft.ads.youtube.enabled} />
              </div>
            }
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer YouTube Ads"
                description="Active la réception des notifications de commentaires"
                checked={draft.ads.youtube.enabled}
                onChange={(v) => updateYt({ enabled: v })}
              />
              <AdminInput
                label="API Key"
                value={draft.ads.youtube.apiKey}
                onChange={(v) => updateYt({ apiKey: v })}
                secret
                placeholder="AIzaSy..."
                hint="Clé API YouTube Data v3"
              />
              <AdminInput
                label="Channel ID"
                value={draft.ads.youtube.channelId}
                onChange={(v) => updateYt({ channelId: v })}
                placeholder="UCxxxxxxx"
                hint="ID de votre chaîne YouTube"
              />
              <AdminToggle
                label="Répondre automatiquement aux commentaires"
                description="Génère et publie une réponse IA sous chaque commentaire"
                checked={draft.ads.youtube.autoReplyComments}
                onChange={(v) => updateYt({ autoReplyComments: v })}
              />

              {/* YouTube verify token (read-only) */}
              <div>
                <label htmlFor="yt-verify-token" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
                  Verify Token (généré)
                </label>
                <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 border border-white/5">
                  <input
                    id="yt-verify-token"
                    type="text"
                    readOnly
                    value={draft.ads.youtube.verifyToken}
                    className="bg-transparent flex-1 outline-none text-sm font-mono text-gray-300"
                    aria-readonly="true"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(draft.ads.youtube.verifyToken, 'yt-verify')}
                    className="text-xs text-gray-500 hover:text-white inline-flex items-center gap-1"
                    aria-label="Copier le verify token YouTube"
                  >
                    {copiedKey === 'yt-verify' ? <Check className="w-3.5 h-3.5 text-green-400" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                    Copier
                  </button>
                </div>
              </div>

              <WebhookUrlBox
                url={ytWebhookUrl}
                onCopy={() => copyToClipboard(ytWebhookUrl, 'yt-webhook')}
                copied={copiedKey === 'yt-webhook'}
                hint="Configurez le callback PubSubHubbub sur https://pubsubhubbub.appspot.com/subscribe"
              />

              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <ExternalLink className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>
                  Pour recevoir les notifications de commentaires, abonnez votre callback sur{' '}
                  <a
                    href="https://pubsubhubbub.appspot.com/subscribe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white"
                  >
                    pubsubhubbub.appspot.com/subscribe
                  </a>{' '}
                  avec le mode <code className="bg-black/30 px-1 rounded">subscribe</code> et l'URL webhook ci-dessus.
                </span>
              </div>
            </div>
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}

// ─── Webhook URL display box with copy action ─────────────────────────
function WebhookUrlBox({ url, onCopy, copied, hint }: {
  url: string;
  onCopy: () => void;
  copied: boolean;
  hint?: string;
}) {
  return (
    <div className="p-3 rounded-xl glass border border-white/5">
      <div className="flex items-center justify-between mb-1 gap-2">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">URL Webhook</p>
        <button
          type="button"
          onClick={onCopy}
          className="text-xs text-gray-500 hover:text-white inline-flex items-center gap-1"
          aria-label="Copier l'URL webhook"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
      <p className="text-xs font-mono break-all text-gray-300">{url}</p>
      {hint && <p className="text-[11px] text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}
