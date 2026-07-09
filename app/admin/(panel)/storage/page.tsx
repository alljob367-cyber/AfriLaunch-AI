// AfriLaunch AI — Admin > Storage configuration
'use client';

import { useState, useEffect } from 'react';
import { HardDrive } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminSelect, AdminNumber,
  SaveBar, LoadingState, StatusBadge,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';

export default function AdminStoragePage() {
  const { config, loading, saving, save } = useConfig();
  const [draft, setDraft] = useState<typeof config>(null);

  useEffect(() => { if (config && !draft) setDraft(config); }, [config, draft]);

  if (loading || !draft) return <LoadingState />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);

  const handleSave = async () => {
    await save({ storage: draft.storage });
  };

  const st = draft.storage;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="Stockage"
          description="Où stocker les uploads (logos, contenus, médias). Local pour dev, S3/Cloudinary pour la prod."
          icon={HardDrive}
          color="from-cyan-500 to-blue-600"
        />

        <div className="space-y-6">
          {/* Provider */}
          <AdminCard
            title="Provider"
            description="Type de stockage pour les fichiers uploadés"
            action={<StatusBadge ok={st.provider === 'local' || (st.provider === 's3' && !!st.s3.bucket) || (st.provider === 'cloudinary' && !!st.cloudinary.cloudName)} />}
          >
            <div className="space-y-4">
              <AdminSelect
                label="Type de stockage"
                value={st.provider}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    storage: { ...st, provider: v as typeof st.provider },
                  })
                }
                options={[
                  { value: 'local', label: 'Local (système de fichiers)' },
                  { value: 's3', label: 'Amazon S3 / compatible (R2, MinIO)' },
                  { value: 'cloudinary', label: 'Cloudinary (avec optimisation images)' },
                ]}
                hint="Local pour le dev. S3/Cloudinary pour la prod (CDN + scale)."
              />
              <AdminNumber
                label="Taille max des fichiers (MB)"
                value={st.maxFileSizeMb}
                onChange={(v) => setDraft({ ...draft, storage: { ...st, maxFileSizeMb: v } })}
                min={1}
                max={100}
                hint="Au-delà, l'upload sera rejeté. Pour les gros médias, utilisez un presigned URL S3."
              />
            </div>
          </AdminCard>

          {/* Stockage local */}
          <AdminCard
            title="Stockage local"
            description="Chemin absolu sur le serveur où sauver les fichiers"
            action={<StatusBadge ok={st.provider === 'local' && !!st.local.path} />}
          >
            <div className={`space-y-4 ${st.provider !== 'local' ? 'opacity-50 pointer-events-none' : ''}`}>
              <AdminInput
                label="Chemin du dossier"
                value={st.local.path}
                onChange={(v) => setDraft({ ...draft, storage: { ...st, local: { path: v } } })}
                placeholder="/home/z/my-project/uploads"
                hint="Le dossier sera créé s'il n'existe pas. Doit être accessible en écriture."
              />
            </div>
          </AdminCard>

          {/* Amazon S3 */}
          <AdminCard
            title="Amazon S3"
            description="S3 ou tout stockage compatible (Cloudflare R2, MinIO, Wasabi, Backblaze B2)"
            action={<StatusBadge ok={st.provider === 's3' && !!st.s3.bucket && !!st.s3.accessKey} />}
          >
            <div className={`space-y-4 ${st.provider !== 's3' ? 'opacity-50 pointer-events-none' : ''}`}>
              <AdminInput
                label="Bucket"
                value={st.s3.bucket}
                onChange={(v) => setDraft({ ...draft, storage: { ...st, s3: { ...st.s3, bucket: v } } })}
                placeholder="afrilaunch-uploads"
              />
              <AdminInput
                label="Région"
                value={st.s3.region}
                onChange={(v) => setDraft({ ...draft, storage: { ...st, s3: { ...st.s3, region: v } } })}
                placeholder="eu-west-1 ou auto pour R2"
              />
              <AdminInput
                label="Access Key"
                value={st.s3.accessKey}
                onChange={(v) => setDraft({ ...draft, storage: { ...st, s3: { ...st.s3, accessKey: v } } })}
                placeholder="AKIA..."
              />
              <AdminInput
                label="Secret Key"
                value={st.s3.secretKey}
                onChange={(v) => setDraft({ ...draft, storage: { ...st, s3: { ...st.s3, secretKey: v } } })}
                secret
                placeholder="..."
              />
              <AdminInput
                label="Endpoint personnalisé (optionnel)"
                value={st.s3.endpoint}
                onChange={(v) => setDraft({ ...draft, storage: { ...st, s3: { ...st.s3, endpoint: v } } })}
                placeholder="https://xxx.r2.cloudflarestorage.com"
                hint="Pour R2, MinIO, Wasabi, etc. Laissez vide pour AWS S3 officiel."
              />
            </div>
          </AdminCard>

          {/* Cloudinary */}
          <AdminCard
            title="Cloudinary"
            description="Stockage avec optimisation automatique des images et vidéos"
            action={<StatusBadge ok={st.provider === 'cloudinary' && !!st.cloudinary.cloudName} />}
          >
            <div className={`space-y-4 ${st.provider !== 'cloudinary' ? 'opacity-50 pointer-events-none' : ''}`}>
              <AdminInput
                label="Cloud Name"
                value={st.cloudinary.cloudName}
                onChange={(v) => setDraft({ ...draft, storage: { ...st, cloudinary: { ...st.cloudinary, cloudName: v } } })}
                placeholder="votre-cloud-name"
                hint="Visible sur le dashboard Cloudinary"
              />
              <AdminInput
                label="API Key"
                value={st.cloudinary.apiKey}
                onChange={(v) => setDraft({ ...draft, storage: { ...st, cloudinary: { ...st.cloudinary, apiKey: v } } })}
                placeholder="123456789012345"
              />
              <AdminInput
                label="API Secret"
                value={st.cloudinary.apiSecret}
                onChange={(v) => setDraft({ ...draft, storage: { ...st, cloudinary: { ...st.cloudinary, apiSecret: v } } })}
                secret
                placeholder="..."
              />
            </div>
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
