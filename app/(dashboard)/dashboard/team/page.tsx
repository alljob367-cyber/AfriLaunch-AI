// AfriLaunch AI — Équipe module
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, Send, Mail, Shield, Pencil, Trash2, RefreshCw,
  Check, Crown, type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

type Role = 'Propriétaire' | 'Admin' | 'Éditeur' | 'Membre';

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
}

interface Invite {
  id: string;
  email: string;
  role: Exclude<Role, 'Propriétaire'>;
  sentDate: string;
}

const members: Member[] = [
  { id: 'm1', name: 'Aïssatou Diallo', email: 'aissatou@teranga.mode', role: 'Propriétaire', initials: 'AD' },
  { id: 'm2', name: 'Mamadou Sow', email: 'mamadou@teranga.mode', role: 'Admin', initials: 'MS' },
  { id: 'm3', name: 'Fatou Ndiaye', email: 'fatou@teranga.mode', role: 'Éditeur', initials: 'FN' },
  { id: 'm4', name: 'Kwame Mensah', email: 'kwame@teranga.mode', role: 'Membre', initials: 'KM' },
];

const invites: Invite[] = [
  { id: 'i1', email: 'laye.sow@gmail.com', role: 'Membre', sentDate: '10 juin 2024' },
  { id: 'i2', email: 'contact@baobabcraft.sn', role: 'Admin', sentDate: '08 juin 2024' },
];

const roleStyles: Record<Role, string> = {
  Propriétaire: 'bg-amber-500/10 text-amber-400',
  Admin: 'bg-violet-500/10 text-violet-400',
  Éditeur: 'bg-blue-500/10 text-blue-400',
  Membre: 'bg-gray-500/10 text-gray-300',
};

const stats: { label: string; value: string; icon: LucideIcon; tint: string }[] = [
  { label: 'Membres actifs', value: '4/20', icon: Users, tint: 'text-violet-400' },
  { label: 'Invitations en attente', value: '2', icon: UserPlus, tint: 'text-amber-400' },
  { label: 'Rôles définis', value: '3', icon: Shield, tint: 'text-blue-400' },
];

export default function TeamPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<Role, 'Propriétaire'>>('Membre');

  const handleSendInvite = () => {
    if (!email.trim()) {
      toast({
        title: 'Email manquant',
        description: 'Saisissez l\'adresse email du collaborateur à inviter.',
        variant: 'warning',
      });
      return;
    }
    toast({
      title: 'Invitation envoyée',
      description: `Invitation envoyée à ${email} en tant que ${role}.`,
      variant: 'success',
    });
    setEmail('');
    setRole('Membre');
  };

  const handleChangeRole = (member: Member) => {
    toast({
      title: 'Modification du rôle',
      description: `Ouverture du sélecteur de rôle pour ${member.name}.`,
      variant: 'success',
    });
  };

  const handleRemove = (member: Member) => {
    toast({
      title: 'Membre retiré',
      description: `${member.name} ne fait plus partie de l'organisation.`,
      variant: 'warning',
    });
  };

  const handleResend = (invite: Invite) => {
    toast({
      title: 'Invitation renvoyée',
      description: `Un nouveau mail a été envoyé à ${invite.email}.`,
      variant: 'success',
    });
  };

  const handleCancel = (invite: Invite) => {
    toast({
      title: 'Invitation annulée',
      description: `L'invitation de ${invite.email} a été annulée.`,
      variant: 'warning',
    });
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-purple-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Équipe"
          description="Invitez vos collaborateurs, gérez les rôles et permissions. Plan Pro : jusqu'à 20 membres."
          icon={Users}
          gradient="from-violet-500 to-purple-600"
          action={
            <button
              type="button"
              onClick={() => toast({ title: 'Journal d\'activité', description: 'Ouverture du journal des actions de l\'équipe.', variant: 'success' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold glass hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" /> Activité
            </button>
          }
        />

        {/* Stats row */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
          aria-label="Statistiques de l'équipe"
        >
          {stats.map((s) => (
            <div key={s.label} className="card-premium">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={cn('w-4 h-4', s.tint)} aria-hidden="true" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            </div>
          ))}
        </motion.section>

        {/* Members */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
          aria-labelledby="members-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-violet-400" aria-hidden="true" />
            <h2 id="members-title" className="text-xl font-bold">Membres</h2>
          </header>
          <ul className="space-y-3">
            {members.map((member, i) => {
              const isOwner = member.role === 'Propriétaire';
              return (
                <motion.li
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4 border border-white/5 hover:border-white/15 transition-all duration-300 flex items-center gap-4 flex-wrap"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 font-bold text-white text-sm">
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{member.name}</h3>
                      {isOwner && <Crown className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{member.email}</p>
                  </div>
                  <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', roleStyles[member.role])}>
                    {member.role}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="status-dot active" aria-hidden="true" /> Actif
                  </span>
                  {!isOwner && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleChangeRole(member)}
                        aria-label={`Changer le rôle de ${member.name}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold glass hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Changer le rôle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(member)}
                        aria-label={`Retirer ${member.name} de l'équipe`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Retirer
                      </button>
                    </div>
                  )}
                </motion.li>
              );
            })}
          </ul>
        </motion.section>

        {/* Pending invites */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
          aria-labelledby="invites-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <Mail className="w-5 h-5 text-violet-400" aria-hidden="true" />
            <h2 id="invites-title" className="text-xl font-bold">Invitations en attente</h2>
          </header>
          <ul className="space-y-3">
            {invites.map((invite, i) => (
              <motion.li
                key={invite.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-4 border border-white/5 hover:border-white/15 transition-all duration-300 flex items-center gap-4 flex-wrap"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-amber-400" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <h3 className="font-semibold text-sm">{invite.email}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Invité en tant que {invite.role} · {invite.sentDate}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                  <span className="status-dot warning" aria-hidden="true" /> En attente
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleResend(invite)}
                    aria-label={`Renvoyer l'invitation à ${invite.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold glass hover:bg-white/10 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Renvoyer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancel(invite)}
                    aria-label={`Annuler l'invitation de ${invite.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Annuler
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.section>

        {/* Invite a member */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-premium"
          aria-labelledby="invite-form-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <UserPlus className="w-5 h-5 text-violet-400" aria-hidden="true" />
            <h2 id="invite-form-title" className="text-xl font-bold">Inviter un membre</h2>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="invite-email" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Email du collaborateur
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex : collaborateur@email.com"
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-violet-500/50 outline-none text-sm"
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Rôle
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Exclude<Role, 'Propriétaire'>)}
                className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-violet-500/50 outline-none text-sm custom-scrollbar"
              >
                <option value="Admin">Admin</option>
                <option value="Éditeur">Éditeur</option>
                <option value="Membre">Membre</option>
              </select>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleSendInvite}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:scale-[1.02] transition-transform shadow-lg"
            >
              <Send className="w-4 h-4" aria-hidden="true" /> Envoyer l&apos;invitation
            </button>
            <ul className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" /> Admin : accès complet</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" /> Éditeur : création & publication</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" /> Membre : lecture & commentaires</li>
            </ul>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
