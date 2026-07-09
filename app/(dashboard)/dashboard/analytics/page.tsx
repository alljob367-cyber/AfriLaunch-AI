// AfriLaunch AI — Analytics module (empty state)
'use client';

import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-blue-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Analytics"
          description="Suivez portée, engagement, conversions et ROI. L'IA prédit vos meilleurs moments de publication."
          icon={BarChart3}
          gradient="from-sky-500 to-blue-600"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 border border-white/5"
        >
          <EmptyState
            icon={BarChart3}
            title="Aucune donnée analytics"
            description="Connectez vos réseaux et publiez du contenu pour voir vos statistiques ici. Portée, engagement, conversions et ROI suivront automatiquement."
            action={{ label: 'Connecter mes réseaux', href: '/dashboard/social' }}
            gradient="from-sky-500 to-blue-600"
          />
        </motion.div>
      </div>
    </div>
  );
}
