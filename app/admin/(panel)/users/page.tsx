// AfriLaunch AI — Admin > Users (mock)
'use client';

import { useState } from 'react';
import { Users, Mail, UserPlus, Pencil, Trash2, ShieldCheck, Shield, Eye } from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminSelect,
  SaveBar, LoadingState,
} from '@/components/admin/ui';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Éditeur';
  lastActive: string;
  avatarColor: string;
}

const INITIAL_USERS: MockUser[] = [
  {
    id: 'u1',
    name: 'Aïssatou Diallo',
    email: 'admin@afrilaunch.ai',
    role: 'Owner',
    lastActive: 'Il y a 2 min',
    avatarColor: 'from-red-500 to-orange-600',
  },
  {
    id: 'u2',
    name: 'Mamadou Sow',
    email: 'mamadou@example.com',
    role: 'Admin',
    lastActive: 'Il y a 1 h',
    avatarColor: 'from-violet-500 to-purple-600',
  },
  {
    id: 'u3',
    name: 'Fatou Ndiaye',
    email: 'fatou@example.com',
    role: 'Éditeur',
    lastActive: 'Hier',
    avatarColor: 'from-teal-500 to-green-600',
  },
];

const ROLE_STYLES: Record<MockUser['role'], { icon: typeof ShieldCheck; classes: string }> = {
  Owner: { icon: ShieldCheck, classes: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  Admin: { icon: Shield, classes: 'bg-violet-500/15 text-violet-400 border border-violet-500/30' },
  Éditeur: { icon: Eye, classes: 'bg-teal-500/15 text-teal-400 border border-teal-500/30' },
};

const STATS = [
  { label: 'Total utilisateurs', value: '1,247', hint: '+18 cette semaine' },
  { label: 'Actifs cette semaine', value: '892', hint: '71% du total' },
  { label: 'Admins', value: '3', hint: '1 Owner + 2 Admins/Éditeurs' },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users] = useState<MockUser[]>(INITIAL_USERS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Admin');

  // No real config used here — mock data only. dirty stays false conceptually,
  // but we pass dirty=true so the SaveBar button is enabled and the click toast fires.
  const dirty = true;
  const saving = false;

  const handleEdit = (user: MockUser) => {
    toast({
      title: 'Modification (simulé)',
      description: `Édition du rôle de ${user.name} — interface à venir.`,
      variant: 'default',
    });
  };

  const handleRemove = (user: MockUser) => {
    toast({
      title: 'Retrait (simulé)',
      description: `${user.name} serait retiré des administrateurs.`,
      variant: 'warning',
    });
  };

  const handleInvite = () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast({
        title: 'Email invalide',
        description: 'Saisissez une adresse email valide.',
        variant: 'error',
      });
      return;
    }
    toast({
      title: 'Invitation envoyée',
      description: `Email envoyé à ${inviteEmail} (rôle: ${inviteRole}).`,
      variant: 'success',
    });
    setInviteEmail('');
  };

  const handleSaveBar = () => {
    toast({
      title: 'Aucune modification à enregistrer',
      description: 'Cette page ne persiste pas de configuration serveur.',
      variant: 'default',
    });
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="Utilisateurs"
          description="Gérez les administrateurs de la plateforme (pour la démo, liste mockée)."
          icon={Users}
          color="from-indigo-500 to-violet-600"
        />

        <div className="space-y-6">
          {/* Statistiques */}
          <AdminCard title="Statistiques" description="Aperçu de l'activité utilisateur">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl glass border border-white/5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-[11px] text-gray-500 mt-1">{stat.hint}</p>
                </div>
              ))}
            </div>
          </AdminCard>

          {/* Liste admins */}
          <AdminCard
            title="Administrateurs"
            description="Membres avec accès au panneau admin"
          >
            <ul className="space-y-3 list-none p-0 m-0">
              {users.map((user) => {
                const roleStyle = ROLE_STYLES[user.role];
                const RoleIcon = roleStyle.icon;
                return (
                  <li
                    key={user.id}
                    className="flex items-center gap-4 p-3 rounded-xl glass border border-white/5"
                  >
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white flex-shrink-0',
                        user.avatarColor,
                      )}
                      aria-hidden="true"
                    >
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                            roleStyle.classes,
                          )}
                        >
                          <RoleIcon className="w-3 h-3" aria-hidden="true" />
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      <p className="text-[11px] text-gray-600 mt-0.5">Actif: {user.lastActive}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(user)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold glass border border-white/10 hover:bg-white/10 transition-colors"
                        aria-label={`Modifier ${user.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Modifier</span>
                      </button>
                      {user.role !== 'Owner' && (
                        <button
                          type="button"
                          onClick={() => handleRemove(user)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                          aria-label={`Retirer ${user.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span className="hidden sm:inline">Retirer</span>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </AdminCard>

          {/* Inviter */}
          <AdminCard
            title="Inviter un admin"
            description="Envoyer une invitation par email à un nouvel administrateur"
            action={<UserPlus className="w-4 h-4 text-indigo-400" aria-hidden="true" />}
          >
            <div className="space-y-4">
              <AdminInput
                label="Email de l'invité"
                value={inviteEmail}
                onChange={setInviteEmail}
                type="email"
                placeholder="nouveau.admin@example.com"
                required
              />
              <AdminSelect
                label="Rôle"
                value={inviteRole}
                onChange={setInviteRole}
                options={[
                  { value: 'Admin', label: 'Admin (accès complet sauf Owner)' },
                  { value: 'Éditeur', label: 'Éditeur (lecture + écriture, pas de config)' },
                  { value: 'Lecteur', label: 'Lecteur (lecture seule)' },
                ]}
                hint="Le rôle Owner ne peut pas être attribué par invitation."
              />
              <button
                type="button"
                onClick={handleInvite}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:scale-105 transition-transform shadow-lg"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                Envoyer l'invitation
              </button>
            </div>
          </AdminCard>

          <SaveBar onSave={handleSaveBar} saving={saving} dirty={dirty} />
        </div>
      </div>
    </div>
  );
}
