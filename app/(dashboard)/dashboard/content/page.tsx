// AfriLaunch AI — Contenu module (empty state)
'use client';

import { motion } from 'framer-motion';
import { PenSquare } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';

export default function ContentPage() {
  const { toast } = useToast();

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-pink-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-rose-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Contenu"
          description="Créez posts, reels, flyers, scripts vidéo et newsletters. 50+ formats IA pour chaque réseau social africain."
          icon={PenSquare}
          gradient="from-pink-500 to-rose-600"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 border border-white/5"
        >
          <EmptyState
            icon={PenSquare}
            title="Aucun contenu créé"
            description="Générez posts, reels, flyers et newsletters avec l'IA. 50+ formats pré-configurés pour chaque réseau social."
            action={{
              label: 'Créer mon premier contenu',
              onClick: () =>
                toast({
                  title: 'Content Agent',
                  description: 'Ouverture du générateur de contenu IA…',
                  variant: 'success',
                }),
            }}
            gradient="from-pink-500 to-rose-600"
          />
        </motion.div>
      </div>
    </div>
  );
}
