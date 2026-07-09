// AfriLaunch AI — Admin > Feature flags configuration
'use client';

import { useState, useEffect } from 'react';
import { ToggleLeft } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminToggle,
  SaveBar, LoadingState,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';
import type { AppConfig } from '@/lib/config-store';

interface FlagDef {
  key: keyof AppConfig['features'];
  label: string;
  description: string;
}

const FLAGS: FlagDef[] = [
  { key: 'agents', label: 'Agents IA', description: '13 agents spécialisés' },
  { key: 'payments', label: 'Paiements', description: 'Mobile Money, Stripe, PayPal' },
  { key: 'social', label: 'Réseaux sociaux', description: 'Publication et inbox unifiée' },
  { key: 'analytics', label: 'Analytics', description: 'Stats prédictives' },
  { key: 'ecommerce', label: 'E-commerce', description: 'Boutique en ligne' },
  { key: 'ai', label: 'IA générative', description: 'Génération de contenu' },
  { key: 'multiTenant', label: 'Multi-tenant', description: 'Plusieurs organisations par utilisateur' },
  { key: 'whiteLabel', label: 'White-label', description: 'Marque blanche pour agences' },
  { key: 'api', label: 'API publique', description: 'REST API pour développeurs' },
];

export default function AdminFeaturesPage() {
  const { config, loading, saving, save } = useConfig();
  const [draft, setDraft] = useState<typeof config>(null);

  useEffect(() => { if (config && !draft) setDraft(config); }, [config, draft]);

  if (loading || !draft) return <LoadingState />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);

  const handleSave = async () => {
    await save({ features: draft.features });
  };

  const toggleFlag = (key: FlagDef['key'], value: boolean) => {
    setDraft({
      ...draft,
      features: { ...draft.features, [key]: value },
    });
  };

  const activeCount = FLAGS.filter((f) => draft.features[f.key]).length;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="Feature flags"
          description="Activez ou désactivez des modules entiers de l'application. Utile pour le rollout progressif."
          icon={ToggleLeft}
          color="from-amber-500 to-yellow-600"
        />

        <div className="space-y-6">
          <AdminCard
            title="Modules"
            description={`${activeCount} / ${FLAGS.length} modules actifs`}
          >
            <div className="divide-y divide-white/5">
              {FLAGS.map((flag) => (
                <AdminToggle
                  key={flag.key}
                  label={flag.label}
                  description={flag.description}
                  checked={draft.features[flag.key]}
                  onChange={(v) => toggleFlag(flag.key, v)}
                />
              ))}
            </div>
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
