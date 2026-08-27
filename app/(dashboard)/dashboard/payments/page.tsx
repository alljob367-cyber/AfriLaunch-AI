// AfriLaunch AI — Paiements module (empty state)
'use client';

import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';

export default function PaymentsPage() {
  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-green-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Paiements"
          description="Acceptez Mobile Money, cartes bancaires et PayPal. Cartes virtuelles pour vos dépenses business."
          icon={CreditCard}
          gradient="from-teal-500 to-green-600"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 border border-white/5"
        >
          <EmptyState
            icon={CreditCard}
            title="Aucun paiement configuré"
            description="Activez Mobile Money, cartes bancaires et PayPal pour recevoir vos premiers paiements. Configuration en quelques minutes depuis l'admin."
            action={{ label: 'Voir les offres', href: '/dashboard/subscription' }}
            gradient="from-teal-500 to-green-600"
          />
        </motion.div>
      </div>
    </div>
  );
}
