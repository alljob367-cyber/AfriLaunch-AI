// AfriLaunch AI — Agents IA module (empty state)
'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';

export default function AgentsPage() {
  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-indigo-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Agents IA"
          description="13 agents spécialisés pour automatiser votre business africain. Chaque agent est un expert métier formé sur les réalités du marché local."
          icon={Bot}
          gradient="from-indigo-500 to-violet-600"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 border border-white/5"
        >
          <EmptyState
            icon={Bot}
            title="Aucun agent configuré"
            description="Activez vos 13 agents IA spécialisés depuis la configuration. Chaque agent est un expert métier prêt à automatiser vos tâches."
            action={{ label: 'Configurer les agents', href: '/admin/ai' }}
            gradient="from-indigo-500 to-violet-600"
          />
        </motion.div>
      </div>
    </div>
  );
}
