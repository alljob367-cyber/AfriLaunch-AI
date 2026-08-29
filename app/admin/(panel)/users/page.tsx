// AfriLaunch AI — Admin > Users (real data from /api/admin/users)
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Mail, UserPlus, Trash2, ShieldCheck, Shield, Eye, RefreshCw,
  Loader2, UserX, AlertCircle,
} from 'lucide-react';
import {
  AdminPageHeader, AdminCard, AdminInput, AdminSelect, LoadingState,
} from '@/components/admin/ui';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface RealUser {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  plan: string;
  planStatus: string;
  credits: number;
  createdAt: string;
  lastLoginAt: string | null;
  isAdmin?: boolean;
}

interface Stats {
  total: number;
  active: number;
  pendingPayment: number;
  admins: number;
  newThisMonth: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Jamais';
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'À l\'instant';
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `Il y a ${d} j`;
  return date.toLocaleDateString('fr-FR');
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<RealUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Admin');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users);
        setStats(data.stats);
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleDelete(user: RealUser) {
    if (!confirm(`Supprimer définitivement ${user.firstName} (${user.email}) ?\n\nCette action est irréversible.`)) return;
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: 'Utilisateur supprimé', description: `${user.firstName} a été retiré.`, variant: 'warning' });
        await fetchUsers();
      } else { toast({ title: 'Échec', description: data.error, variant: 'error' }); }
    } catch (err) { toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' }); }
    finally { setDeletingId(null); }
  }

  async function handleToggleStatus(user: RealUser) {
    const newStatus = user.planStatus === 'active' ? 'pending_payment' : 'active';
    const action = newStatus === 'active' ? 'activer' : 'suspendre';
    if (!confirm(`${action === 'activer' ? 'Activer' : 'Suspendre'} ${user.firstName} (${user.email}) ?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planStatus: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({
          title: newStatus === 'active' ? 'Utilisateur activé ✅' : 'Utilisateur suspendu ⏸️',
          description: `${user.firstName} est maintenant ${newStatus === 'active' ? 'actif' : 'en attente de paiement'}.`,
          variant: newStatus === 'active' ? 'success' : 'warning',
        });
        await fetchUsers();
      } else { toast({ title: 'Échec', description: data.error, variant: 'error' }); }
    } catch (err) { toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' }); }
  }

  async function handleChangePlan(user: RealUser, newPlan: string) {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: newPlan, planStatus: 'active' }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: `Plan changé → ${newPlan} ✅`, description: `${user.firstName} est maintenant sur le plan ${newPlan}.`, variant: 'success' });
        await fetchUsers();
      } else { toast({ title: 'Échec', description: data.error, variant: 'error' }); }
    } catch (err) { toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' }); }
  }

  function handleInvite() {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast({
        title: 'Email invalide',
        description: 'Saisissez une adresse email valide.',
        variant: 'error',
      });
      return;
    }
    // Invitations aren't persisted yet — show honest message.
    toast({
      title: 'Invitation — fonctionnalité à venir',
      description: `L'envoi d'invitations par email sera disponible prochainément. Pour le moment, demandez à ${inviteEmail} de s'inscrire sur /register.`,
      variant: 'default',
    });
    setInviteEmail('');
  }

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader
          title="Utilisateurs"
          description="Liste réelle des comptes inscrits sur la plateforme."
          icon={Users}
          color="from-indigo-500 to-violet-600"
        />

        <div className="space-y-6">
          {/* Statistiques réelles */}
          <AdminCard
            title="Statistiques"
            description="Données en temps réel"
            action={
              <button
                type="button"
                onClick={fetchUsers}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold glass border border-white/10 hover:bg-white/10"
              >
                <RefreshCw className="w-3 h-3" aria-hidden="true" />
                Actualiser
              </button>
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: stats?.total ?? 0, hint: `${stats?.newThisMonth ?? 0} ce mois` },
                { label: 'Actifs', value: stats?.active ?? 0, hint: 'planStatus = active' },
                { label: 'En attente paiement', value: stats?.pendingPayment ?? 0, hint: 'planStatus = pending' },
                { label: 'Admins', value: stats?.admins ?? 0, hint: 'isAdmin = true' },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl glass border border-white/5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-[11px] text-gray-500 mt-1">{stat.hint}</p>
                </div>
              ))}
            </div>
          </AdminCard>

          {/* Liste des utilisateurs réels */}
          <AdminCard
            title="Tous les utilisateurs"
            description={`${users.length} compte(s) inscrit(s)`}
          >
            {users.length === 0 ? (
              <div className="text-center py-10">
                <UserX className="w-10 h-10 text-gray-600 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm text-gray-400">Aucun utilisateur inscrit pour le moment.</p>
                <p className="text-xs text-gray-600 mt-1">
                  Les nouveaux inscrits apparaîtront ici automatiquement.
                </p>
              </div>
            ) : (
              <ul className="space-y-3 list-none p-0 m-0">
                {users.map((user) => {
                  const isAdmin = user.isAdmin || user.email === 'admin@albermon.com' || user.email === 'admin@afrilaunch.ai';
                  const roleStyle = isAdmin
                    ? { icon: ShieldCheck, classes: 'bg-red-500/15 text-red-400 border border-red-500/30', label: 'Admin' }
                    : user.planStatus === 'active'
                      ? { icon: Eye, classes: 'bg-teal-500/15 text-teal-400 border border-teal-500/30', label: user.plan }
                      : { icon: AlertCircle, classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/30', label: 'En attente' };
                  const RoleIcon = roleStyle.icon;
                  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
                  return (
                    <li
                      key={user.id}
                      className="flex items-center gap-4 p-3 rounded-xl glass border border-white/5"
                    >
                      <div
                        className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        aria-hidden="true"
                      >
                        {getInitials(fullName || user.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate">{fullName || '(sans nom)'}</p>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                              roleStyle.classes,
                            )}
                          >
                            <RoleIcon className="w-3 h-3" aria-hidden="true" />
                            {roleStyle.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          Dernière connexion&nbsp;: {timeAgo(user.lastLoginAt)} · {user.credits.toLocaleString('fr-FR')} crédits
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!isAdmin && (
                          <>
                            {/* Plan selector */}
                            <select
                              value={user.plan}
                              onChange={(e) => handleChangePlan(user, e.target.value)}
                              className="text-xs glass rounded-lg px-2 py-1.5 border border-white/10 outline-none"
                              aria-label={`Changer le plan de ${user.email}`}
                            >
                              <option value="starter" className="bg-gray-900">Starter</option>
                              <option value="pro" className="bg-gray-900">Pro</option>
                              <option value="business" className="bg-gray-900">Business</option>
                              <option value="enterprise" className="bg-gray-900">Enterprise</option>
                            </select>
                            {/* Activate/Suspend toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user)}
                              className={cn(
                                'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                                user.planStatus === 'active'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20',
                              )}
                              aria-label={user.planStatus === 'active' ? `Suspendre ${user.email}` : `Activer ${user.email}`}
                            >
                              {user.planStatus === 'active' ? 'Suspendre' : 'Activer'}
                            </button>
                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              disabled={deletingId === user.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-60"
                              aria-label={`Supprimer ${user.email}`}
                            >
                              {deletingId === user.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                                : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>

          {/* Inviter */}
          <AdminCard
            title="Inviter un utilisateur"
            description="Inviter un nouvel utilisateur à s'inscrire"
            action={<UserPlus className="w-4 h-4 text-indigo-400" aria-hidden="true" />}
          >
            <div className="space-y-4">
              <AdminInput
                label="Email de l'invité"
                value={inviteEmail}
                onChange={setInviteEmail}
                type="email"
                placeholder="nouvel.utilisateur@example.com"
                required
              />
              <AdminSelect
                label="Rôle à attribuer après inscription"
                value={inviteRole}
                onChange={setInviteRole}
                options={[
                  { value: 'Utilisateur', label: 'Utilisateur (accès dashboard standard)' },
                  { value: 'Admin', label: 'Admin (accès panneau admin — à configurer manuellement)' },
                ]}
                hint="L'invitation par email automatique sera disponible prochainement. Pour le moment, communiquez le lien /register à l'utilisateur."
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
        </div>
      </div>
    </div>
  );
}
