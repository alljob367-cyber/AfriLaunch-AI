// AfriLaunch AI — Campagnes marketing module (empty state)
'use client';

import { motion } from 'framer-motion';
import { Megaphone } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';

export default function CampaignsPage() {
  const { toast } = useToast();

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-amber-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Campagnes marketing"
          description="Lancez et pilotez vos publicités Meta, TikTok et Google Ads. L'IA optimise le ciblage et le budget automatiquement."
          icon={Megaphone}
          gradient="from-orange-500 to-amber-600"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 border border-white/5"
        >
          <EmptyState
            icon={Megaphone}
            title="Aucune campagne"
            description="Lancez vos publicités Meta, TikTok et Google Ads avec l'IA. L'Ads Agent optimise le ciblage et le budget automatiquement."
            action={{
              label: 'Lancer une campagne',
              onClick: () =>
                toast({
                  title: 'Nouvelle campagne',
                  description: 'Ouverture du formulaire de création de campagne…',
                  variant: 'success',
                }),
            }}
            gradient="from-orange-500 to-amber-600"
          />
        </motion.div>
      </div>
    </div>
  );
}
