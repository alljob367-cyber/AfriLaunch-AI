// AfriLaunch AI — Réseaux sociaux module (empty state)
'use client';

import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';

export default function SocialPage() {
  const { toast } = useToast();

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-green-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-emerald-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Réseaux sociaux"
          description="Connectez et gérez WhatsApp Business, Instagram, TikTok, Facebook, LinkedIn et X depuis un seul tableau de bord."
          icon={Share2}
          gradient="from-green-500 to-emerald-600"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 border border-white/5"
        >
          <EmptyState
            icon={Share2}
            title="Aucun réseau connecté"
            description="Connectez Instagram, TikTok, Facebook, WhatsApp et plus pour publier automatiquement et centraliser vos messages."
            action={{
              label: 'Connecter un réseau',
              onClick: () =>
                toast({
                  title: 'Connexion réseau social',
                  description: 'Sélection de la plateforme à connecter…',
                  variant: 'success',
                }),
            }}
            gradient="from-green-500 to-emerald-600"
          />
        </motion.div>
      </div>
    </div>
  );
}
