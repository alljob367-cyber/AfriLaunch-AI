// AfriLaunch AI — Admin > Payments configuration
'use client';

import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminSelect, AdminToggle,
  SaveBar, LoadingState, TestButton, StatusBadge,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';

export default function AdminPaymentsPage() {
  const { config, loading, saving, save, test } = useConfig();
  const [draft, setDraft] = useState<typeof config>(null);

  useEffect(() => { if (config && !draft) setDraft(config); }, [config, draft]);

  if (loading || !draft) return <LoadingState />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);

  const handleSave = async () => {
    await save({ payments: draft.payments });
  };

  const p = draft.payments.providers;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="Paiements"
          description="Acceptez Mobile Money, cartes bancaires et PayPal. Configurez chaque provider séparément."
          icon={CreditCard}
          color="from-teal-500 to-green-600"
        />

        <div className="space-y-6">
          {/* Devise */}
          <AdminCard title="Devise" description="Devise par défaut affichée aux utilisateurs">
            <AdminSelect
              label="Devise principale"
              value={draft.payments.currency}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  payments: { ...draft.payments, currency: v },
                })
              }
              options={[
                { value: 'USD', label: 'USD — Dollar américain ($)' },
                { value: 'EUR', label: 'EUR — Euro (€)' },
                { value: 'XOF', label: 'XOF — Franc CFA Ouest (FCFA)' },
                { value: 'XAF', label: 'XAF — Franc CFA Central (FCFA)' },
                { value: 'NGN', label: 'NGN — Naira nigérian (₦)' },
                { value: 'GHS', label: 'GHS — Cedi ghanéen (₵)' },
                { value: 'KES', label: 'KES — Shilling kényan (KSh)' },
                { value: 'MAD', label: 'MAD — Dirham marocain (DH)' },
              ]}
              hint="Les paiements réels sont convertis depuis la devise du provider vers cette devise."
            />
          </AdminCard>

          {/* Stripe */}
          <AdminCard
            title="Stripe"
            description="Cartes bancaires internationales (Visa, Mastercard, Amex)"
            action={<StatusBadge ok={!!p.stripe.secretKey && p.stripe.enabled} />}
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer Stripe"
                description="Accepter les paiements par carte bancaire"
                checked={p.stripe.enabled}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, stripe: { ...p.stripe, enabled: v } },
                    },
                  })
                }
              />
              <AdminInput
                label="Clé publiable"
                value={p.stripe.publishableKey}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, stripe: { ...p.stripe, publishableKey: v } },
                    },
                  })
                }
                placeholder="pk_live_... ou pk_test_..."
              />
              <AdminInput
                label="Clé secrète"
                value={p.stripe.secretKey}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, stripe: { ...p.stripe, secretKey: v } },
                    },
                  })
                }
                secret
                placeholder="sk_live_... ou sk_test_..."
              />
              <AdminInput
                label="Secret webhook"
                value={p.stripe.webhookSecret}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, stripe: { ...p.stripe, webhookSecret: v } },
                    },
                  })
                }
                secret
                placeholder="whsec_..."
                hint="Trouvé dans le dashboard Stripe > Developers > Webhooks"
              />
              <TestButton onTest={() => test('payment', 'stripe')} label="Tester Stripe" />
            </div>
          </AdminCard>

          {/* Flutterwave */}
          <AdminCard
            title="Flutterwave"
            description="Mobile Money et cartes pour l'Afrique (Sénégal, Côte d'Ivoire, Nigeria, Ghana, Kenya)"
            action={<StatusBadge ok={!!p.flutterwave.secretKey && p.flutterwave.enabled} />}
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer Flutterwave"
                description="Accepter Mobile Money et cartes via Flutterwave"
                checked={p.flutterwave.enabled}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, flutterwave: { ...p.flutterwave, enabled: v } },
                    },
                  })
                }
              />
              <AdminInput
                label="Clé publique"
                value={p.flutterwave.publicKey}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, flutterwave: { ...p.flutterwave, publicKey: v } },
                    },
                  })
                }
                placeholder="FLWPUBK-..."
              />
              <AdminInput
                label="Clé secrète"
                value={p.flutterwave.secretKey}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, flutterwave: { ...p.flutterwave, secretKey: v } },
                    },
                  })
                }
                secret
                placeholder="FLWSECK-..."
              />
              <AdminInput
                label="Clé de chiffrement"
                value={p.flutterwave.encryptionKey}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, flutterwave: { ...p.flutterwave, encryptionKey: v } },
                    },
                  })
                }
                secret
                placeholder="FLWSECK_TEST..."
              />
              <TestButton onTest={() => test('payment', 'flutterwave')} label="Tester Flutterwave" />
            </div>
          </AdminCard>

          {/* PayPal */}
          <AdminCard
            title="PayPal"
            description="Paiements internationaux via PayPal"
            action={<StatusBadge ok={!!p.paypal.clientSecret && p.paypal.enabled} />}
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer PayPal"
                description="Accepter les paiements PayPal"
                checked={p.paypal.enabled}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, paypal: { ...p.paypal, enabled: v } },
                    },
                  })
                }
              />
              <AdminInput
                label="Client ID"
                value={p.paypal.clientId}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, paypal: { ...p.paypal, clientId: v } },
                    },
                  })
                }
                placeholder="AY..."
              />
              <AdminInput
                label="Client Secret"
                value={p.paypal.clientSecret}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, paypal: { ...p.paypal, clientSecret: v } },
                    },
                  })
                }
                secret
                placeholder="E..."
              />
              <AdminSelect
                label="Mode"
                value={p.paypal.mode}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, paypal: { ...p.paypal, mode: v as 'sandbox' | 'live' } },
                    },
                  })
                }
                options={[
                  { value: 'sandbox', label: 'Sandbox (test)' },
                  { value: 'live', label: 'Live (production)' },
                ]}
                hint="Sandbox pour les tests, Live pour les vrais paiements."
              />
              <TestButton onTest={() => test('payment', 'paypal')} label="Tester PayPal" />
            </div>
          </AdminCard>

          {/* Orange Money */}
          <AdminCard
            title="Orange Money"
            description="Mobile Money Orange (Sénégal, Côte d'Ivoire, Mali, Cameroun, Burkina)"
            action={<StatusBadge ok={!!p.orangeMoney.apiKey && p.orangeMoney.enabled} />}
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer Orange Money"
                description="Accepter les paiements Orange Money"
                checked={p.orangeMoney.enabled}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, orangeMoney: { ...p.orangeMoney, enabled: v } },
                    },
                  })
                }
              />
              <AdminInput
                label="Clé API"
                value={p.orangeMoney.apiKey}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, orangeMoney: { ...p.orangeMoney, apiKey: v } },
                    },
                  })
                }
                secret
                placeholder="OM-..."
              />
              <AdminInput
                label="Clé marchand"
                value={p.orangeMoney.merchantKey}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, orangeMoney: { ...p.orangeMoney, merchantKey: v } },
                    },
                  })
                }
                placeholder="Identifiant marchand Orange"
              />
              <TestButton onTest={() => test('payment', 'orangeMoney')} label="Tester Orange Money" />
            </div>
          </AdminCard>

          {/* Wave */}
          <AdminCard
            title="Wave"
            description="Mobile Money Wave (Sénégal, Côte d'Ivoire, Mali)"
            action={<StatusBadge ok={!!p.wave.apiKey && p.wave.enabled} />}
          >
            <div className="space-y-4">
              <AdminToggle
                label="Activer Wave"
                description="Accepter les paiements Wave"
                checked={p.wave.enabled}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, wave: { ...p.wave, enabled: v } },
                    },
                  })
                }
              />
              <AdminInput
                label="Clé API"
                value={p.wave.apiKey}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, wave: { ...p.wave, apiKey: v } },
                    },
                  })
                }
                secret
                placeholder="wave_sn_..."
              />
              <TestButton onTest={() => test('payment', 'wave')} label="Tester Wave" />
            </div>
          </AdminCard>

          {/* Mobile Money générique */}
          <AdminCard
            title="Mobile Money (générique)"
            description="Agrégateur Wave/Orange/MTN via Flutterwave"
            action={<StatusBadge ok={p.mobileMoney.enabled} />}
          >
            <div className="space-y-3">
              <AdminToggle
                label="Activer Mobile Money agrégé"
                description="Affiche un sélecteur unifié de tous les opérateurs Mobile Money supportés"
                checked={p.mobileMoney.enabled}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    payments: {
                      ...draft.payments,
                      providers: { ...p, mobileMoney: { enabled: v } },
                    },
                  })
                }
              />
              <p className="text-[11px] text-gray-500">
                Cette option active une UI unifiée pour tous les opérateurs Mobile Money. Nécessite que Flutterwave (ou un autre agrégateur) soit configuré ci-dessus.
              </p>
            </div>
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
