// AfriLaunch AI — Identité de marque module (empty state)
'use client';

import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';

export default function IdentityPage() {
  const { toast } = useToast();

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Identité de marque"
          description="Générez votre nom, logo, palette et charte graphique avec l'IA, adaptés au marché africain."
          icon={Palette}
          gradient="from-violet-500 to-purple-600"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 border border-white/5"
        >
          <EmptyState
            icon={Palette}
            title="Aucune identité de marque"
            description="Générez votre nom, logo et charte graphique avec le Branding Agent. 4 variants par requête, adaptés au marché africain."
            action={{
              label: 'Générer mon identité',
              onClick: () =>
                toast({
                  title: 'Redirection vers le Branding Agent',
                  description: 'Lancement de la génération de votre identité de marque…',
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
