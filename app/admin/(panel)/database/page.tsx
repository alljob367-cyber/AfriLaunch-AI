// AfriLaunch AI — Admin > Database configuration
'use client';

import { useState, useEffect } from 'react';
import { Database, FileCode, Terminal } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminSelect, AdminToggle,
  SaveBar, LoadingState, TestButton, StatusBadge,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';

export default function AdminDatabasePage() {
  const { config, loading, saving, save, test } = useConfig();
  const [draft, setDraft] = useState<typeof config>(null);

  useEffect(() => { if (config && !draft) setDraft(config); }, [config, draft]);

  if (loading || !draft) return <LoadingState />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);

  const handleSave = async () => {
    await save({ database: draft.database });
  };

  // No database migration endpoint yet — the migration runs automatically
  // on Vercel deploy (supabase-schema.sql). The button below is informational.
  const isConfigured = !!draft.database.url;
  const prismaPath = '/home/z/my-project/prisma/schema.prisma';

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="Base de données"
          description="Configurez la connexion à votre base de données. SQLite pour le dev, PostgreSQL recommandé pour la production."
          icon={Database}
          color="from-blue-500 to-cyan-600"
        />

        <div className="space-y-6">
          {/* Provider */}
          <AdminCard
            title="Provider"
            description="Type de base de données utilisé par Prisma ORM"
            action={<StatusBadge ok={isConfigured} />}
          >
            <div className="space-y-4">
              <AdminSelect
                label="Type de base"
                value={draft.database.provider}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    database: { ...draft.database, provider: v as typeof draft.database.provider },
                  })
                }
                options={[
                  { value: 'sqlite', label: 'SQLite (dev, fichier local)' },
                  { value: 'postgresql', label: 'PostgreSQL (recommandé production)' },
                  { value: 'mysql', label: 'MySQL / MariaDB' },
                  { value: 'mongodb', label: 'MongoDB (NoSQL)' },
                ]}
                hint="SQLite ne nécessite aucun serveur. PostgreSQL recommandé pour la mise à l'échelle."
              />
              <AdminToggle
                label="Connexion SSL"
                description="Chiffrer la connexion (requis pour les DBs managées comme Supabase, Neon, PlanetScale)"
                checked={draft.database.ssl}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    database: { ...draft.database, ssl: v },
                  })
                }
              />
            </div>
          </AdminCard>

          {/* Connexion */}
          <AdminCard title="Connexion" description="URL de connexion au format attendu par le provider">
            <div className="space-y-4">
              <AdminInput
                label="URL de connexion"
                value={draft.database.url}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    database: { ...draft.database, url: v },
                  })
                }
                secret
                placeholder={
                  draft.database.provider === 'sqlite'
                    ? 'file:/home/z/my-project/db/custom.db'
                    : 'postgresql://user:pass@host:5432/db'
                }
                hint={
                  draft.database.provider === 'sqlite'
                    ? 'Format: file:/chemin/vers/base.db'
                    : 'Format: postgresql://utilisateur:motdepasse@hote:5432/base'
                }
              />
              <TestButton onTest={() => test('database')} label="Tester la connexion" />
            </div>
          </AdminCard>

          {/* Schéma Prisma */}
          <AdminCard
            title="Schéma Prisma"
            description="Fichier source du schéma de la base de données"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl glass border border-white/5">
                <FileCode className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Fichier de schéma
                  </p>
                  <code className="text-xs font-mono text-gray-300 break-all">{prismaPath}</code>
                  <p className="text-[11px] text-gray-500 mt-2">
                    Définit les modèles User, Organization, Agent, Payment, Content, etc.
                    La migration crée les tables dans la base configurée ci-dessus.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <button
                  type="button"
                  disabled
                  title="La migration s'exécute automatiquement au déploiement Vercel via supabase-schema.sql"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold glass border border-white/10 opacity-60 cursor-not-allowed"
                >
                  <Terminal className="w-4 h-4" aria-hidden="true" />
                  Migration auto (au déploiement)
                </button>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Le schéma Supabase (<code className="font-mono text-gray-400">supabase-schema.sql</code>) s'exécute
                  automatiquement au déploiement Vercel. La table <code className="font-mono text-gray-400">kv_store</code>
                  est créée avec les policies RLS. Aucune action manuelle requise.
                </p>
              </div>
            </div>
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
