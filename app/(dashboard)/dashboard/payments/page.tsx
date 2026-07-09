// AfriLaunch AI — Paiements module
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Wallet, Plus, Check, Download, ArrowUpRight, ArrowDownRight,
  Building2, Smartphone, DollarSign, TrendingUp, Receipt, type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  fee: string;
  connected: boolean;
  icon: LucideIcon;
  color: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  method: string;
  amount: number;
  status: 'Réussi' | 'En attente' | 'Échoué';
}

const paymentMethods: PaymentMethod[] = [
  { id: 'orange', name: 'Orange Money', description: 'Mobile Money — Sénégal, Côte d\'Ivoire, Mali', fee: '2,5 % frais', connected: true, icon: Smartphone, color: 'from-orange-500 to-amber-600' },
  { id: 'wave', name: 'Wave', description: 'Mobile Money — Sénégal, Côte d\'Ivoire', fee: '1,5 % frais', connected: true, icon: Wallet, color: 'from-sky-500 to-blue-600' },
  { id: 'stripe', name: 'Visa / Mastercard', description: 'Cartes bancaires via Stripe', fee: '2,9 % + $0,30', connected: true, icon: CreditCard, color: 'from-indigo-500 to-violet-600' },
  { id: 'paypal', name: 'PayPal', description: 'Paiements internationaux', fee: '3,5 % + $0,35', connected: false, icon: DollarSign, color: 'from-blue-500 to-cyan-600' },
];

const transactions: Transaction[] = [
  { id: 't1', date: '12 juin 2024', description: 'Vente — Robe wax Aya', method: 'Orange Money', amount: 45, status: 'Réussi' },
  { id: 't2', date: '12 juin 2024', description: 'Remboursement — Commande #1247', method: 'Visa', amount: -32, status: 'Réussi' },
  { id: 't3', date: '11 juin 2024', description: 'Abonnement AfriLaunch Pro', method: 'Visa', amount: -29.99, status: 'Réussi' },
  { id: 't4', date: '11 juin 2024', description: 'Vente — Lot de foulards panafricains', method: 'Wave', amount: 68, status: 'En attente' },
  { id: 't5', date: '10 juin 2024', description: 'Vente — Sac en cuir artisanal', method: 'PayPal', amount: 120, status: 'Échoué' },
  { id: 't6', date: '10 juin 2024', description: 'Vente — Collection baobab', method: 'Orange Money', amount: 89, status: 'Réussi' },
];

const statusStyles: Record<Transaction['status'], string> = {
  'Réussi': 'bg-green-500/10 text-green-400',
  'En attente': 'bg-amber-500/10 text-amber-400',
  'Échoué': 'bg-red-500/10 text-red-400',
};

const stats: { label: string; value: string; icon: LucideIcon; tint: string }[] = [
  { label: 'Solde disponible', value: '$4 820', icon: Wallet, tint: 'text-teal-400' },
  { label: 'Transactions ce mois', value: '1 247', icon: Receipt, tint: 'text-green-400' },
  { label: 'Volume mensuel', value: '$28 540', icon: TrendingUp, tint: 'text-emerald-400' },
  { label: 'Frais prélevés', value: '$284', icon: CreditCard, tint: 'text-amber-400' },
];

function formatAmount(amount: number): string {
  const formatted = amount.toFixed(2).replace('.', ',');
  return amount >= 0 ? `+${formatted} $` : `${formatted} $`;
}

export default function PaymentsPage() {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (method: PaymentMethod) => {
    setConnecting(method.id);
    toast({
      title: 'OAuth PayPal simulé',
      description: `Connexion à ${method.name} en cours...`,
      variant: 'success',
    });
    await new Promise((r) => setTimeout(r, 1200));
    setConnecting(null);
    toast({
      title: `${method.name} connecté`,
      description: 'Le moyen de paiement est maintenant actif.',
      variant: 'success',
    });
  };

  const handleOrderCard = () => {
    toast({
      title: 'Demande de carte virtuelle envoyée',
      description: 'Votre carte sera disponible sous 24 h.',
      variant: 'success',
    });
  };

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
          action={
            <button
              type="button"
              onClick={() => toast({ title: 'Relevé de compte', description: 'Génération du relevé PDF en cours…', variant: 'success' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold glass hover:bg-white/10 transition-colors"
            >
              <Download className="w-4 h-4" aria-hidden="true" /> Relevé
            </button>
          }
        />

        {/* Stats row */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          aria-label="Statistiques de paiements"
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

        {/* Payment methods */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
          aria-labelledby="methods-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <CreditCard className="w-5 h-5 text-teal-400" aria-hidden="true" />
            <h2 id="methods-title" className="text-xl font-bold">Méthodes de paiement</h2>
          </header>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method, i) => (
              <motion.li
                key={method.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all duration-300 flex items-center gap-4"
              >
                <div className={cn('w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0', method.color)}>
                  <method.icon className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{method.name}</h3>
                    {method.connected && <span className="status-dot active" aria-label="Connecté" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{method.description}</p>
                  <p className="text-xs text-teal-400 font-semibold mt-1">{method.fee}</p>
                </div>
                {method.connected ? (
                  <span className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-green-500/10 text-green-400 font-semibold">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" /> Connecté
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConnect(method)}
                    disabled={connecting === method.id}
                    aria-label={`Connecter ${method.name}`}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-semibold bg-gradient-to-r from-teal-500 to-green-600 text-white hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    {connecting === method.id ? 'Connexion…' : 'Connecter'}
                  </button>
                )}
              </motion.li>
            ))}
          </ul>
        </motion.section>

        {/* Recent transactions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
          aria-labelledby="transactions-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <Receipt className="w-5 h-5 text-teal-400" aria-hidden="true" />
            <h2 id="transactions-title" className="text-xl font-bold">Transactions récentes</h2>
          </header>
          <ul className="space-y-3">
            {transactions.map((tx, i) => {
              const isCredit = tx.amount >= 0;
              return (
                <motion.li
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4 border border-white/5 hover:border-white/15 transition-all duration-300 flex items-center gap-4 flex-wrap"
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', isCredit ? 'bg-green-500/10' : 'bg-red-500/10')}>
                    {isCredit ? (
                      <ArrowDownRight className="w-5 h-5 text-green-400" aria-hidden="true" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <h3 className="font-semibold text-sm">{tx.description}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{tx.date} · {tx.method}</p>
                  </div>
                  <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', statusStyles[tx.status])}>
                    {tx.status}
                  </span>
                  <p className={cn('font-bold tabular-nums text-sm w-28 text-right', isCredit ? 'text-green-400' : 'text-red-400')}>
                    {formatAmount(tx.amount)}
                  </p>
                </motion.li>
              );
            })}
          </ul>
        </motion.section>

        {/* Virtual card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          aria-labelledby="card-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <CreditCard className="w-5 h-5 text-teal-400" aria-hidden="true" />
            <h2 id="card-title" className="text-xl font-bold">Carte virtuelle</h2>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="relative aspect-[1.6/1] rounded-2xl bg-gradient-to-br from-teal-500 to-green-600 p-6 shadow-2xl overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/80 text-xs uppercase tracking-widest">AfriLaunch AI</p>
                    <p className="text-white font-bold text-lg mt-1">Carte business</p>
                  </div>
                  <Building2 className="w-8 h-8 text-white/80" aria-hidden="true" />
                </div>
                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500" aria-label="Puce de carte" role="img" />
                <div>
                  <p className="text-white font-mono text-lg tracking-widest">•••• •••• •••• 4242</p>
                  <div className="flex items-end justify-between mt-2">
                    <p className="text-white/90 text-sm font-semibold tracking-wide">Aïssatou Diallo</p>
                    <p className="text-white/90 text-sm font-mono">12/27</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold mb-2">Carte virtuelle prépayée</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Utilisez une carte virtuelle pour vos abonnements, publicités et achats en ligne.
                Rechargez en Mobile Money ou par virement.
              </p>
              <ul className="space-y-2 text-sm text-gray-300 mb-5">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-400" aria-hidden="true" /> Activation immédiate</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-400" aria-hidden="true" /> Sans frais mensuels</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-400" aria-hidden="true" /> Plafond personnalisable</li>
              </ul>
              <button
                type="button"
                onClick={handleOrderCard}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-green-600 text-white hover:scale-[1.02] transition-transform shadow-lg"
              >
                <Plus className="w-4 h-4" aria-hidden="true" /> Commander une carte
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
