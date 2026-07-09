// AfriLaunch AI — Admin > Social media providers configuration
'use client';

import { useState, useEffect } from 'react';
import { Share2, Link2 } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminToggle,
  SaveBar, LoadingState, StatusBadge,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';

export default function AdminSocialPage() {
  const { config, loading, saving, save } = useConfig();
  const [draft, setDraft] = useState<typeof config>(null);

  useEffect(() => { if (config && !draft) setDraft(config); }, [config, draft]);

  if (loading || !draft) return <LoadingState />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);

  const handleSave = async () => {
    await save({ social: draft.social });
  };

  const s = draft.social;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-green-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="Réseaux sociaux"
          description="Connectez vos comptes pour publication automatique et boîte de réception unifiée."
          icon={Share2}
          color="from-green-500 to-emerald-600"
        />

        <div className="space-y-6">
          {/* Instagram */}
          <AdminCard
            title="Instagram Business"
            description="Publication de reels/posts et gestion des DMs via l'API Graph"
            action={<StatusBadge ok={s.instagram.enabled && !!s.instagram.accessToken} />}
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer Instagram"
                description="Activer la publication et l'inbox Instagram"
                checked={s.instagram.enabled}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, instagram: { ...s.instagram, enabled: v } },
                  })
                }
              />
              <AdminInput
                label="Token d'accès"
                value={s.instagram.accessToken}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, instagram: { ...s.instagram, accessToken: v } },
                  })
                }
                secret
                placeholder="IGQVJ..."
                hint="Token longue durée obtenu via le flow OAuth Instagram"
              />
              <AdminInput
                label="ID du compte Business"
                value={s.instagram.businessAccountId}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, instagram: { ...s.instagram, businessAccountId: v } },
                  })
                }
                placeholder="17841400000000000"
              />
              <div className="flex items-center gap-2 pt-1">
                <Link2 className="w-4 h-4 text-green-400" aria-hidden="true" />
                <span className="text-xs text-gray-500">Connexion via OAuth requise</span>
                <button
                  type="button"
                  disabled
                  className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass border border-white/10 opacity-50 cursor-not-allowed"
                  aria-disabled="true"
                >
                  Connecter via OAuth
                </button>
              </div>
            </div>
          </AdminCard>

          {/* TikTok */}
          <AdminCard
            title="TikTok for Business"
            description="Publication de vidéos et accès aux analytics TikTok"
            action={<StatusBadge ok={s.tiktok.enabled && !!s.tiktok.accessToken} />}
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer TikTok"
                description="Activer la publication TikTok"
                checked={s.tiktok.enabled}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, tiktok: { ...s.tiktok, enabled: v } },
                  })
                }
              />
              <AdminInput
                label="Client Key"
                value={s.tiktok.clientKey}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, tiktok: { ...s.tiktok, clientKey: v } },
                  })
                }
                placeholder="aw..."
              />
              <AdminInput
                label="Client Secret"
                value={s.tiktok.clientSecret}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, tiktok: { ...s.tiktok, clientSecret: v } },
                  })
                }
                secret
                placeholder="..."
              />
              <AdminInput
                label="Token d'accès"
                value={s.tiktok.accessToken}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, tiktok: { ...s.tiktok, accessToken: v } },
                  })
                }
                secret
                placeholder="Obtenu via OAuth"
              />
              <div className="flex items-center gap-2 pt-1">
                <Link2 className="w-4 h-4 text-green-400" aria-hidden="true" />
                <span className="text-xs text-gray-500">Connexion via OAuth requise</span>
                <button
                  type="button"
                  disabled
                  className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass border border-white/10 opacity-50 cursor-not-allowed"
                  aria-disabled="true"
                >
                  Connecter via OAuth
                </button>
              </div>
            </div>
          </AdminCard>

          {/* Facebook */}
          <AdminCard
            title="Facebook Pages"
            description="Publication et messagerie sur vos pages Facebook"
            action={<StatusBadge ok={s.facebook.enabled && !!s.facebook.pageAccessToken} />}
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer Facebook"
                description="Activer la publication sur les pages Facebook"
                checked={s.facebook.enabled}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, facebook: { ...s.facebook, enabled: v } },
                  })
                }
              />
              <AdminInput
                label="App ID"
                value={s.facebook.appId}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, facebook: { ...s.facebook, appId: v } },
                  })
                }
                placeholder="123456789012345"
              />
              <AdminInput
                label="App Secret"
                value={s.facebook.appSecret}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, facebook: { ...s.facebook, appSecret: v } },
                  })
                }
                secret
                placeholder="..."
              />
              <AdminInput
                label="Token d'accès Page"
                value={s.facebook.pageAccessToken}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, facebook: { ...s.facebook, pageAccessToken: v } },
                  })
                }
                secret
                placeholder="EAAB..."
                hint="Token longue durée de la page gérée"
              />
              <div className="flex items-center gap-2 pt-1">
                <Link2 className="w-4 h-4 text-green-400" aria-hidden="true" />
                <span className="text-xs text-gray-500">Connexion via OAuth requise</span>
                <button
                  type="button"
                  disabled
                  className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass border border-white/10 opacity-50 cursor-not-allowed"
                  aria-disabled="true"
                >
                  Connecter via OAuth
                </button>
              </div>
            </div>
          </AdminCard>

          {/* WhatsApp */}
          <AdminCard
            title="WhatsApp Business"
            description="Envoi de messages et templates WhatsApp Business API"
            action={<StatusBadge ok={s.whatsapp.enabled && !!s.whatsapp.accessToken} />}
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer WhatsApp"
                description="Activer l'envoi de messages WhatsApp"
                checked={s.whatsapp.enabled}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, whatsapp: { ...s.whatsapp, enabled: v } },
                  })
                }
              />
              <AdminInput
                label="Phone Number ID"
                value={s.whatsapp.phoneNumberId}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, whatsapp: { ...s.whatsapp, phoneNumberId: v } },
                  })
                }
                placeholder="123456789012345"
              />
              <AdminInput
                label="Token d'accès"
                value={s.whatsapp.accessToken}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, whatsapp: { ...s.whatsapp, accessToken: v } },
                  })
                }
                secret
                placeholder="EAAJ..."
              />
              <AdminInput
                label="Business ID"
                value={s.whatsapp.businessId}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, whatsapp: { ...s.whatsapp, businessId: v } },
                  })
                }
                placeholder="123456789012345"
              />
              <div className="flex items-center gap-2 pt-1">
                <Link2 className="w-4 h-4 text-green-400" aria-hidden="true" />
                <span className="text-xs text-gray-500">Connexion via OAuth requise</span>
                <button
                  type="button"
                  disabled
                  className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass border border-white/10 opacity-50 cursor-not-allowed"
                  aria-disabled="true"
                >
                  Connecter via OAuth
                </button>
              </div>
            </div>
          </AdminCard>

          {/* LinkedIn */}
          <AdminCard
            title="LinkedIn"
            description="Publication sur profils et pages LinkedIn"
            action={<StatusBadge ok={s.linkedin.enabled && !!s.linkedin.accessToken} />}
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer LinkedIn"
                description="Activer la publication LinkedIn"
                checked={s.linkedin.enabled}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, linkedin: { ...s.linkedin, enabled: v } },
                  })
                }
              />
              <AdminInput
                label="Client ID"
                value={s.linkedin.clientId}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, linkedin: { ...s.linkedin, clientId: v } },
                  })
                }
                placeholder="77..."
              />
              <AdminInput
                label="Client Secret"
                value={s.linkedin.clientSecret}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, linkedin: { ...s.linkedin, clientSecret: v } },
                  })
                }
                secret
                placeholder="..."
              />
              <AdminInput
                label="Token d'accès"
                value={s.linkedin.accessToken}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, linkedin: { ...s.linkedin, accessToken: v } },
                  })
                }
                secret
                placeholder="Obtenu via OAuth"
              />
              <div className="flex items-center gap-2 pt-1">
                <Link2 className="w-4 h-4 text-green-400" aria-hidden="true" />
                <span className="text-xs text-gray-500">Connexion via OAuth requise</span>
                <button
                  type="button"
                  disabled
                  className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass border border-white/10 opacity-50 cursor-not-allowed"
                  aria-disabled="true"
                >
                  Connecter via OAuth
                </button>
              </div>
            </div>
          </AdminCard>

          {/* Twitter / X */}
          <AdminCard
            title="X (Twitter)"
            description="Publication de tweets et replies via l'API v2"
            action={<StatusBadge ok={s.twitter.enabled && !!s.twitter.accessToken && !!s.twitter.accessSecret} />}
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer X (Twitter)"
                description="Activer la publication Twitter/X"
                checked={s.twitter.enabled}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, twitter: { ...s.twitter, enabled: v } },
                  })
                }
              />
              <AdminInput
                label="API Key"
                value={s.twitter.apiKey}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, twitter: { ...s.twitter, apiKey: v } },
                  })
                }
                placeholder="..."
              />
              <AdminInput
                label="API Secret"
                value={s.twitter.apiSecret}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, twitter: { ...s.twitter, apiSecret: v } },
                  })
                }
                secret
                placeholder="..."
              />
              <AdminInput
                label="Access Token"
                value={s.twitter.accessToken}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, twitter: { ...s.twitter, accessToken: v } },
                  })
                }
                secret
                placeholder="1234567890-..."
              />
              <AdminInput
                label="Access Secret"
                value={s.twitter.accessSecret}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    social: { ...s, twitter: { ...s.twitter, accessSecret: v } },
                  })
                }
                secret
                placeholder="..."
              />
              <div className="flex items-center gap-2 pt-1">
                <Link2 className="w-4 h-4 text-green-400" aria-hidden="true" />
                <span className="text-xs text-gray-500">Connexion via OAuth requise</span>
                <button
                  type="button"
                  disabled
                  className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass border border-white/10 opacity-50 cursor-not-allowed"
                  aria-disabled="true"
                >
                  Connecter via OAuth
                </button>
              </div>
            </div>
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
