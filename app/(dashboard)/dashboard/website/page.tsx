// AfriLaunch AI — Site web module (empty state)
'use client';

import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';

export default function WebsitePage() {
  const { toast } = useToast();

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-cyan-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Site web"
          description="Créez et publiez votre site web en minutes. Landing pages, boutiques e-commerce, sites vitrines — générés par IA."
          icon={Globe}
          gradient="from-blue-500 to-cyan-600"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 border border-white/5"
        >
          <EmptyState
            icon={Globe}
            title="Aucun site web"
            description="Créez votre landing page, boutique ou site vitrine en minutes avec l'IA. Choisissez un template et laissez l'IA générer le contenu."
            action={{
              label: 'Créer mon site',
              onClick: () =>
                toast({
                  title: 'Création de site',
                  description: 'Sélection d\'un template et lancement de l\'éditeur IA…',
                  variant: 'success',
                }),
            }}
            gradient="from-blue-500 to-cyan-600"
          />
        </motion.div>
      </div>
    </div>
  );
}
