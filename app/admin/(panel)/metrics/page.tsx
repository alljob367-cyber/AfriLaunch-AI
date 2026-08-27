// AfriLaunch AI — Admin > Financial Metrics
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, Users, Zap, Gift,
  Loader2, RefreshCw, AlertCircle, Activity, Calculator,
} from 'lucide-react';
import {
  AdminPageHeader, AdminCard, LoadingState,
} from '@/components/admin/ui';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface Metrics {
  mrr: number;
  arr: number;
  totalUsers: number;
  activeUsers: number;
  usersByPlan: Record<string, number>;
  totalCreditsUsedThisMonth: number;
  totalCreditsRemaining: number;
  estimatedAICostUSD: number;
  grossMargin: number;
  grossMarginPercent: number;
  newUsersThisMonth: number;
  plans: Array<{
    id: string; name: string; price: number; credits: number;
    users: number; mrr: number; estimatedCost: number; margin: number;
  }>;
}

export default function AdminMetricsPage() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/metrics', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) setMetrics(data.metrics);
      else toast({ title: 'Erreur', description: data.error, variant: 'error' });
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  if (loading || !metrics) return <LoadingState />;

  const planColors: Record<string, string> = {
    free: 'from-gray-500 to-gray-600',
    starter: 'from-blue-500 to-cyan-600',
    pro: 'from-indigo-500 to-violet-600',
    business: 'from-violet-500 to-purple-600',
    enterprise: 'from-amber-500 to-yellow-600',
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-green-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-emerald-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <AdminPageHeader
          title="Métriques financières"
          description="Suivez le MRR, les coûts IA et la marge brute en temps réel."
          icon={Calculator}
          color="from-green-500 to-emerald-600"
        />

        <div className="mb-6 flex justify-end">
          <button type="button" onClick={fetchMetrics} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass hover:bg-white/10">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} aria-hidden="true" />
            Actualiser
          </button>
        </div>

        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={DollarSign} label="MRR" value={`${metrics.mrr.toFixed(2)}$`} subtitle={`ARR: ${metrics.arr.toFixed(0)}$`} gradient="from-green-500 to-emerald-600" />
            <KpiCard icon={Zap} label="Coût IA/mois" value={`${metrics.estimatedAICostUSD.toFixed(2)}$`} subtitle="Estimation OpenRouter" gradient="from-orange-500 to-amber-600" />
            <KpiCard icon={TrendingUp} label="Marge brute" value={`${metrics.grossMargin.toFixed(2)}$`} subtitle={`${metrics.grossMarginPercent}%`} gradient="from-indigo-500 to-violet-600" highlight={metrics.grossMarginPercent > 50} />
            <KpiCard icon={Users} label="Utilisateurs" value={String(metrics.totalUsers)} subtitle={`${metrics.activeUsers} actifs · ${metrics.newUsersThisMonth} nouveaux`} gradient="from-blue-500 to-cyan-600" />
          </div>

          {/* Margin alert */}
          {metrics.grossMarginPercent < 50 && metrics.mrr > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="glass rounded-2xl p-4 border border-red-500/30 bg-red-500/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-red-400">Marge brute faible ({metrics.grossMarginPercent}%)</p>
                    <p className="text-sm text-gray-400 mt-1">Votre coût IA représente plus de 50% du MRR. Vérifiez le routage par plan dans /admin/ai et activez OpenRouter avec des modèles économiques (gemini-flash, gpt-4o-mini) pour Free/Starter.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Plans breakdown */}
          <AdminCard title="Répartition par plan" description="Détail du MRR et des coûts IA estimés par plan d'abonnement">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-white/5">
                    <th className="py-3 px-2">Plan</th>
                    <th className="py-3 px-2 text-right">Prix</th>
                    <th className="py-3 px-2 text-right">Crédits/mois</th>
                    <th className="py-3 px-2 text-right">Utilisateurs</th>
                    <th className="py-3 px-2 text-right">MRR</th>
                    <th className="py-3 px-2 text-right">Coût IA estimé</th>
                    <th className="py-3 px-2 text-right">Marge</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.plans.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-7 h-7 rounded-lg bg-gradient-to-br', planColors[p.id] || 'from-gray-500 to-gray-600')} />
                          <span className="font-semibold">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">{p.price === 0 ? 'Gratuit' : `${p.price.toFixed(2)}$`}</td>
                      <td className="py-3 px-2 text-right tabular-nums text-gray-400">{p.credits === -1 ? 'Illimité' : p.credits.toLocaleString('fr-FR')}</td>
                      <td className="py-3 px-2 text-right tabular-nums font-semibold">{p.users}</td>
                      <td className="py-3 px-2 text-right tabular-nums text-green-400">{p.mrr.toFixed(2)}$</td>
                      <td className="py-3 px-2 text-right tabular-nums text-orange-400">{p.estimatedCost.toFixed(2)}$</td>
                      <td className={cn('py-3 px-2 text-right tabular-nums font-semibold', p.margin >= 0 ? 'text-green-400' : 'text-red-400')}>{p.margin.toFixed(2)}$</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-white/10">
                    <td className="py-3 px-2 font-bold">Total</td>
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2 text-right tabular-nums font-bold">{metrics.totalUsers}</td>
                    <td className="py-3 px-2 text-right tabular-nums font-bold text-green-400">{metrics.mrr.toFixed(2)}$</td>
                    <td className="py-3 px-2 text-right tabular-nums font-bold text-orange-400">{metrics.estimatedAICostUSD.toFixed(2)}$</td>
                    <td className="py-3 px-2 text-right tabular-nums font-bold text-indigo-400">{metrics.grossMargin.toFixed(2)}$</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </AdminCard>

          {/* Credits overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminCard title="Crédits utilisés ce mois" description="Total des crédits consommés par tous les utilisateurs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{metrics.totalCreditsUsedThisMonth.toLocaleString('fr-FR')}</p>
                  <p className="text-xs text-gray-500">crédits ce mois</p>
                </div>
              </div>
            </AdminCard>
            <AdminCard title="Crédits restants" description="Total des crédits disponibles chez les utilisateurs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{metrics.totalCreditsRemaining.toLocaleString('fr-FR')}</p>
                  <p className="text-xs text-gray-500">crédits restants</p>
                </div>
              </div>
            </AdminCard>
          </div>

          {/* Recommendations */}
          <AdminCard title="💡 Recommandations d'optimisation" description="Actions pour améliorer la marge">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Routage par plan activé</strong> : Free → gemini-flash, Starter → gpt-4o-mini, Pro/Business → claude-3.5-sonnet, Enterprise → gpt-4o.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Plafond quotidien Free</strong> : 10 messages/jour pour limiter l'abus.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">⚠</span>
                <span><strong>Activez OpenRouter</strong> dans /admin/ai avec une clé valide pour activer le routage par plan. Sans OpenRouter, tous les plans utilisent le provider primaire configuré.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">⚠</span>
                <span><strong>Chargez 100$ sur OpenRouter</strong> avant lancement (suffit pour ~2 mois de beta avec 50 utilisateurs).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">→</span>
                <span><strong>Surveillez la marge</strong> : si elle passe sous 50%, augmentez les prix ou réduisez l'utilisation moyenne (20%) via un cache ou des prompts plus courts.</span>
              </li>
            </ul>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, subtitle, gradient, highlight }: {
  icon: React.ElementType; label: string; value: string; subtitle: string;
  gradient: string; highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass rounded-2xl p-4 border', highlight ? 'border-green-500/30' : 'border-white/5')}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center', gradient)}>
          <Icon className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        {highlight !== undefined && (
          highlight
            ? <TrendingUp className="w-4 h-4 text-green-400" aria-hidden="true" />
            : <TrendingDown className="w-4 h-4 text-red-400" aria-hidden="true" />
        )}
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      <p className="text-[10px] text-gray-600 mt-0.5">{subtitle}</p>
    </motion.div>
  );
}
