// AfriLaunch AI — Équipe module (empty state)
'use client';

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';

export default function TeamPage() {
  const { toast } = useToast();

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
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 border border-white/5"
        >
          <EmptyState
            icon={Users}
            title="Aucun membre d'équipe"
            description="Invitez vos collaborateurs et gérez leurs rôles. Admin, éditeur ou membre — chacun avec des permissions adaptées."
            action={{
              label: 'Inviter un membre',
              onClick: () =>
                toast({
                  title: 'Invitation',
                  description: 'Ouverture du formulaire d\'invitation d\'un nouveau membre…',
                  variant: 'success',
                }),
            }}
            gradient="from-violet-500 to-purple-600"
          />
        </motion.div>
      </div>
    </div>
  );
}
