// AfriLaunch AI — Admin > General settings (app info, password)
'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, Lock, Check } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminSelect,
  SaveBar, LoadingState,
} from '@/components/admin/ui';
import { useConfig } from '@/hooks/use-config';
import { useToast } from '@/components/providers/toast-provider';

export default function AdminGeneralPage() {
  const { config, loading, saving, save, reload } = useConfig();
  const { toast } = useToast();
  const [draft, setDraft] = useState<typeof config>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => { if (config && !draft) setDraft(config); }, [config, draft]);

  if (loading || !draft) return <LoadingState />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);
  const update = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft({ ...draft, [key]: value });

  const handleSave = async () => {
    const ok = await save({
      appName: draft.appName,
      appUrl: draft.appUrl,
      locale: draft.locale,
      timezone: draft.timezone,
      adminEmail: draft.adminEmail,
    });
    if (ok && newPassword) {
      if (newPassword !== confirmPassword) {
        toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas', variant: 'error' });
        return;
      }
      if (newPassword.length < 8) {
        toast({ title: 'Mot de passe trop court', description: 'Minimum 8 caractères', variant: 'error' });
        return;
      }
      try {
        const res = await fetch('/api/admin/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ newPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast({ title: 'Erreur', description: data.error, variant: 'error' });
          return;
        }
        setNewPassword('');
        setConfirmPassword('');
        toast({ title: 'Mot de passe mis à jour', description: 'Utilisez le nouveau mot de passe à la prochaine connexion', variant: 'success' });
      } catch (err) {
        toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
      }
    }
    if (ok) reload();
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-red-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="Configuration générale"
          description="Informations de l'application et sécurité administrateur."
          icon={Settings}
          color="from-slate-500 to-gray-600"
        />

        <div className="space-y-6">
          {/* App info */}
          <AdminCard title="Informations de l'application" description="Nom et URL utilisés dans les emails, métadonnées, etc.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminInput label="Nom de l'app" value={draft.appName} onChange={(v) => update('appName', v)} required />
              <AdminInput label="URL publique" value={draft.appUrl} onChange={(v) => update('appUrl', v)} placeholder="https://..." hint="URL de base pour les liens et webhooks" />
              <AdminSelect label="Locale" value={draft.locale} onChange={(v) => update('locale', v)} options={[
                { value: 'fr-FR', label: 'Français (France)' },
                { value: 'fr-SN', label: 'Français (Sénégal)' },
                { value: 'fr-CI', label: 'Français (Côte d\'Ivoire)' },
                { value: 'en-US', label: 'English (US)' },
                { value: 'en-NG', label: 'English (Nigeria)' },
                { value: 'sw-KE', label: 'Swahili (Kenya)' },
              ]} />
              <AdminSelect label="Fuseau horaire" value={draft.timezone} onChange={(v) => update('timezone', v)} options={[
                { value: 'Africa/Dakar', label: 'Africa/Dakar (GMT+0)' },
                { value: 'Africa/Abidjan', label: 'Africa/Abidjan (GMT+0)' },
                { value: 'Africa/Accra', label: 'Africa/Accra (GMT+0)' },
                { value: 'Africa/Lagos', label: 'Africa/Lagos (GMT+1)' },
                { value: 'Africa/Casablanca', label: 'Africa/Casablanca (GMT+1)' },
                { value: 'Africa/Nairobi', label: 'Africa/Nairobi (GMT+3)' },
              ]} />
            </div>
          </AdminCard>

          {/* Admin security */}
          <AdminCard title="Sécurité admin" description="Email de récupération et changement de mot de passe">
            <div className="space-y-4">
              <AdminInput label="Email admin" value={draft.adminEmail} onChange={(v) => update('adminEmail', v)} type="email" placeholder="admin@example.com" />

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-red-400" aria-hidden="true" />
                  <p className="text-sm font-semibold">Changer le mot de passe</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AdminInput label="Nouveau mot de passe" value={newPassword} onChange={setNewPassword} secret placeholder="Minimum 8 caractères" hint="Laissez vide pour ne pas changer" />
                  <AdminInput label="Confirmer" value={confirmPassword} onChange={setConfirmPassword} secret placeholder="Répétez le mot de passe" />
                </div>
                {draft.adminPasswordHash && (
                  <p className="text-[11px] text-green-400 mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" aria-hidden="true" /> Mot de passe déjà défini (hash SHA-256)
                  </p>
                )}
              </div>
            </div>
          </AdminCard>

          {/* Session config */}
          <AdminCard title="Session & Auth" description="Durée de session et secret JWT">
            <div className="space-y-4">
              <AdminSelect label="Durée de session (heures)" value={String(draft.auth.sessionExpiryHours)} onChange={(v) => update('auth', { ...draft.auth, sessionExpiryHours: Number(v) })} options={[
                { value: '1', label: '1 heure' },
                { value: '4', label: '4 heures' },
                { value: '12', label: '12 heures' },
                { value: '24', label: '24 heures (défaut)' },
                { value: '72', label: '3 jours' },
                { value: '168', label: '7 jours' },
              ]} />
              <AdminInput label="Secret JWT" value={draft.auth.jwtSecret} onChange={(v) => update('auth', { ...draft.auth, jwtSecret: v })} secret hint="Clé de signature des tokens. Régénérer = déconnecter tous les utilisateurs." />
            </div>
          </AdminCard>

          <SaveBar onSave={handleSave} saving={saving} dirty={dirty || !!newPassword} />
        </div>
      </div>
    </div>
  );
}
