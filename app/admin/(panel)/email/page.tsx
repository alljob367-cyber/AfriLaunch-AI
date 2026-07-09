// AfriLaunch AI — Admin > Email & Notifications configuration
'use client';

import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminSelect, AdminToggle, AdminNumber,
  SaveBar, LoadingState, TestButton, StatusBadge,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';

export default function AdminEmailPage() {
  const { config, loading, saving, save, test } = useConfig();
  const [draft, setDraft] = useState<typeof config>(null);

  useEffect(() => { if (config && !draft) setDraft(config); }, [config, draft]);

  if (loading || !draft) return <LoadingState />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);

  const handleSave = async () => {
    await save({ email: draft.email });
  };

  const e = draft.email;
  const providerActive = e.provider;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="Email & Notifications"
          description="Configurez l'envoi d'emails pour notifications, newsletters et resets de mot de passe."
          icon={Mail}
          color="from-orange-500 to-amber-600"
        />

        <div className="space-y-6">
          {/* Expéditeur */}
          <AdminCard
            title="Expéditeur"
            description="Adresse d'envoi et adresse de réponse affichées dans les emails"
            action={<StatusBadge ok={providerActive !== 'none'} label={providerActive === 'none' ? 'Aucun' : 'Configuré'} />}
          >
            <div className="space-y-4">
              <AdminInput
                label="Adresse d'envoi (From)"
                value={e.from}
                onChange={(v) => setDraft({ ...draft, email: { ...e, from: v } })}
                type="email"
                placeholder="noreply@afrilaunch.ai"
                required
                hint="Doit être un domaine vérifié chez votre provider."
              />
              <AdminInput
                label="Adresse de réponse (Reply-To)"
                value={e.replyTo}
                onChange={(v) => setDraft({ ...draft, email: { ...e, replyTo: v } })}
                type="email"
                placeholder="contact@afrilaunch.ai"
              />
              <AdminSelect
                label="Provider"
                value={e.provider}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    email: { ...e, provider: v as typeof e.provider },
                  })
                }
                options={[
                  { value: 'none', label: 'Aucun (notifications désactivées)' },
                  { value: 'resend', label: 'Resend (recommandé, simple)' },
                  { value: 'sendgrid', label: 'SendGrid (entreprise)' },
                  { value: 'smtp', label: 'SMTP (serveur custom)' },
                ]}
                hint="Resend est gratuit jusqu'à 3000 emails/mois. SMTP pour les serveurs existants."
              />
            </div>
          </AdminCard>

          {/* Resend */}
          <AdminCard
            title="Resend"
            description="Service d'envoi moderne, API simple"
            action={<StatusBadge ok={providerActive === 'resend' && !!e.resend.apiKey} />}
          >
            <div className={`space-y-4 ${providerActive !== 'resend' ? 'opacity-50 pointer-events-none' : ''}`}>
              <AdminInput
                label="Clé API Resend"
                value={e.resend.apiKey}
                onChange={(v) => setDraft({ ...draft, email: { ...e, resend: { apiKey: v } } })}
                secret
                placeholder="re_..."
                hint="Créez une clé sur resend.com/api-keys"
              />
              <TestButton onTest={() => test('email')} label="Tester l'envoi" />
            </div>
          </AdminCard>

          {/* SendGrid */}
          <AdminCard
            title="SendGrid"
            description="Service d'envoi d'entreprise de Twilio"
            action={<StatusBadge ok={providerActive === 'sendgrid' && !!e.sendgrid.apiKey} />}
          >
            <div className={`space-y-4 ${providerActive !== 'sendgrid' ? 'opacity-50 pointer-events-none' : ''}`}>
              <AdminInput
                label="Clé API SendGrid"
                value={e.sendgrid.apiKey}
                onChange={(v) => setDraft({ ...draft, email: { ...e, sendgrid: { apiKey: v } } })}
                secret
                placeholder="SG..."
                hint="Clé API avec permission Mail Send"
              />
              <TestButton onTest={() => test('email')} label="Tester l'envoi" />
            </div>
          </AdminCard>

          {/* SMTP */}
          <AdminCard
            title="SMTP"
            description="Serveur SMTP personnalisé (Postfix, Mailgun, etc.)"
            action={<StatusBadge ok={providerActive === 'smtp' && !!e.smtp.host} />}
          >
            <div className={`space-y-4 ${providerActive !== 'smtp' ? 'opacity-50 pointer-events-none' : ''}`}>
              <AdminInput
                label="Hôte SMTP"
                value={e.smtp.host}
                onChange={(v) => setDraft({ ...draft, email: { ...e, smtp: { ...e.smtp, host: v } } })}
                placeholder="smtp.gmail.com"
              />
              <AdminNumber
                label="Port"
                value={e.smtp.port}
                onChange={(v) => setDraft({ ...draft, email: { ...e, smtp: { ...e.smtp, port: v } } })}
                min={1}
                max={65535}
                hint="587 (TLS) ou 465 (SSL) ou 25 (non chiffré)"
              />
              <AdminInput
                label="Utilisateur"
                value={e.smtp.user}
                onChange={(v) => setDraft({ ...draft, email: { ...e, smtp: { ...e.smtp, user: v } } })}
                placeholder="user@example.com"
              />
              <AdminInput
                label="Mot de passe"
                value={e.smtp.password}
                onChange={(v) => setDraft({ ...draft, email: { ...e, smtp: { ...e.smtp, password: v } } })}
                secret
                placeholder="••••••••"
              />
              <AdminToggle
                label="TLS (sécurisé)"
                description="Chiffrer la connexion SMTP — fortement recommandé"
                checked={e.smtp.secure}
                onChange={(v) => setDraft({ ...draft, email: { ...e, smtp: { ...e.smtp, secure: v } } })}
              />
              <TestButton onTest={() => test('email')} label="Tester l'envoi" />
            </div>
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
