// AfriLaunch AI — Admin > Paiements manuels
// Admin can view, approve or reject manual payment orders submitted by users.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Loader2, CheckCircle2, XCircle, Clock, AlertCircle,
  Eye, RefreshCw, X, FileText, Image as ImageIcon, Users, Coins,
} from 'lucide-react';
import { AdminPageHeader, LoadingState } from '@/components/admin/ui';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'plan' | 'pack';
  itemId: string;
  itemName: string;
  amountFCFA: number;
  credits: number;
  country: string;
  method: string;
  methodLabel: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  senderName?: string;
  senderPhone?: string;
  transactionReference?: string;
  proofFileName?: string;
  proofFileType?: string;
  proofUploadedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  total: number;
  pendingAmountFCFA: number;
  approvedAmountFCFA: number;
}

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function countryFlag(code: string): string {
  switch (code) {
    case 'CM': return '🇨🇲';
    case 'SN': return '🇸🇳';
    case 'CI': return '🇨🇮';
    case 'GA': return '🇬🇦';
    default: return '🏳️';
  }
}

function statusBadge(status: Order['status']) {
  switch (status) {
    case 'pending':
      return { label: 'En attente', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: Clock };
    case 'approved':
      return { label: 'Approuvé', className: 'bg-green-500/15 text-green-300 border-green-500/30', icon: CheckCircle2 };
    case 'rejected':
      return { label: 'Rejeté', className: 'bg-red-500/15 text-red-300 border-red-500/30', icon: XCircle };
    case 'expired':
      return { label: 'Expiré', className: 'bg-gray-500/15 text-gray-400 border-gray-500/30', icon: AlertCircle };
  }
}

export default function AdminPaymentsManualPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payment-manual/admin-list', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders as Order[]);
        setStats(data.stats as Stats);
      } else {
        toast({ title: 'Erreur', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredOrders = activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab);

  async function handleAction(order: Order, action: 'approve' | 'reject') {
    let note: string | undefined;
    if (action === 'reject') {
      const reason = window.prompt('Raison du rejet (sera notifiée à l\'utilisateur) :');
      if (reason === null) return; // user cancelled
      if (!reason.trim()) {
        toast({ title: 'Raison requise', description: 'Veuillez indiquer une raison de rejet.', variant: 'warning' });
        return;
      }
      note = reason.trim();
    }

    setActioningId(order.id);
    try {
      const res = await fetch('/api/payment-manual/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId: order.id, action, note }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Action échouée');
      }

      toast({
        title: action === 'approve' ? 'Paiement approuvé' : 'Paiement rejeté',
        description: action === 'approve'
          ? 'Plan/crédits activés pour l\'utilisateur.'
          : 'L\'utilisateur sera notifié.',
        variant: action === 'approve' ? 'success' : 'warning',
      });

      await fetchData();
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'error' });
    } finally {
      setActioningId(null);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-green-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto">
        <AdminPageHeader
          title="Paiements manuels"
          description="Validez ou rejetez les paiements manuels (Mobile Money, virement) soumis par les utilisateurs."
          icon={Wallet}
          color="from-emerald-500 to-green-600"
        />

        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass hover:bg-white/10"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} aria-hidden="true" />
            Actualiser
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Clock}
            label="En attente"
            count={stats?.pending ?? 0}
            amount={stats?.pendingAmountFCFA}
            gradient="from-amber-500 to-orange-600"
          />
          <StatCard
            icon={CheckCircle2}
            label="Approuvés"
            count={stats?.approved ?? 0}
            amount={stats?.approvedAmountFCFA}
            gradient="from-emerald-500 to-green-600"
          />
          <StatCard
            icon={XCircle}
            label="Rejetés"
            count={stats?.rejected ?? 0}
            gradient="from-red-500 to-rose-600"
          />
          <StatCard
            icon={Wallet}
            label="Total"
            count={stats?.total ?? 0}
            gradient="from-slate-500 to-gray-600"
          />
        </div>

        {/* Filter tabs */}
        <div className="mb-6 inline-flex items-center glass rounded-2xl p-1.5">
          {([
            { id: 'all', label: `Tous (${orders.length})` },
            { id: 'pending', label: `En attente (${orders.filter((o) => o.status === 'pending').length})` },
            { id: 'approved', label: `Approuvés (${orders.filter((o) => o.status === 'approved').length})` },
            { id: 'rejected', label: `Rejetés (${orders.filter((o) => o.status === 'rejected').length})` },
          ] as { id: FilterTab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders table */}
        {filteredOrders.length === 0 ? (
          <div className="glass rounded-2xl p-12 border border-white/5 text-center">
            <Wallet className="w-10 h-10 text-gray-600 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm text-gray-500">Aucun paiement dans cette catégorie.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/5 bg-white/[0.02]">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Utilisateur</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Article</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Méthode</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Date</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Statut</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.map((order) => {
                    const sb = statusBadge(order.status);
                    const SIcon = sb.icon;
                    return (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white text-xs">{order.userName || '—'}</p>
                          <p className="text-[11px] text-gray-500">{order.userEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-white text-xs">{order.itemName}</p>
                          <p className="text-emerald-300 font-bold text-xs">{formatFCFA(order.amountFCFA)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-white">{order.methodLabel}</p>
                          <p className="text-[11px] text-gray-500">
                            <span aria-hidden="true">{countryFlag(order.country)}</span> {order.country}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-gray-400">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                              sb.className,
                            )}
                          >
                            <SIcon className="w-3 h-3" aria-hidden="true" />
                            {sb.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailOrder(order)}
                              aria-label="Voir détail"
                              className="p-1.5 rounded-lg glass hover:bg-white/10 text-gray-400 hover:text-white"
                            >
                              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            {order.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAction(order, 'approve')}
                                  disabled={actioningId === order.id}
                                  aria-label="Approuver"
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-green-500/15 text-green-300 border border-green-500/30 hover:bg-green-500/25 transition-colors disabled:opacity-50"
                                >
                                  {actioningId === order.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                  )}
                                  Approuver
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAction(order, 'reject')}
                                  disabled={actioningId === order.id}
                                  aria-label="Rejeter"
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-colors disabled:opacity-50"
                                >
                                  <XCircle className="w-3 h-3" aria-hidden="true" />
                                  Rejeter
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-white/5">
              {filteredOrders.map((order) => {
                const sb = statusBadge(order.status);
                const SIcon = sb.icon;
                return (
                  <div key={order.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{order.userName || '—'}</p>
                        <p className="text-[11px] text-gray-500 truncate">{order.userEmail}</p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0',
                          sb.className,
                        )}
                      >
                        <SIcon className="w-3 h-3" aria-hidden="true" />
                        {sb.label}
                      </span>
                    </div>
                    <p className="text-xs text-white mb-1">{order.itemName}</p>
                    <p className="text-emerald-300 font-bold text-sm mb-2">{formatFCFA(order.amountFCFA)}</p>
                    <p className="text-[11px] text-gray-500 mb-3">
                      {order.methodLabel} · <span aria-hidden="true">{countryFlag(order.country)}</span> {order.country} · {formatDate(order.createdAt)}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailOrder(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold glass hover:bg-white/10"
                      >
                        <Eye className="w-3 h-3" aria-hidden="true" />
                        Détail
                      </button>
                      {order.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAction(order, 'approve')}
                            disabled={actioningId === order.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-green-500/15 text-green-300 border border-green-500/30 disabled:opacity-50"
                          >
                            {actioningId === order.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                            )}
                            Approuver
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(order, 'reject')}
                            disabled={actioningId === order.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30 disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" aria-hidden="true" />
                            Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {detailOrder && (
          <DetailDrawer
            order={detailOrder}
            onClose={() => setDetailOrder(null)}
            onAction={(action) => {
              const order = detailOrder;
              setDetailOrder(null);
              void handleAction(order, action);
            }}
            actioning={actioningId === detailOrder.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  count,
  amount,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  amount?: number;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-white/5"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', gradient)}>
          <Icon className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-white">{count}</p>
      {typeof amount === 'number' && (
        <p className="text-[11px] text-emerald-300 mt-1">{formatFCFA(amount)}</p>
      )}
    </motion.div>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────
function DetailDrawer({
  order,
  onClose,
  onAction,
  actioning,
}: {
  order: Order;
  onClose: () => void;
  onAction: (action: 'approve' | 'reject') => void;
  actioning: boolean;
}) {
  const sb = statusBadge(order.status);
  const SIcon = sb.icon;
  const isImage = order.proofFileType?.startsWith('image/');
  const proofUrl = order.proofFileName
    ? `/api/payment-manual/proof?orderId=${encodeURIComponent(order.id)}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        className="relative glass rounded-t-3xl sm:rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 glass border-b border-white/5 px-5 py-4 flex items-center justify-between">
          <h3 id="detail-title" className="font-bold text-sm">
            Détail du paiement
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                sb.className,
              )}
            >
              <SIcon className="w-3 h-3" aria-hidden="true" />
              {sb.label}
            </span>
            <span className="text-[11px] text-gray-500">
              {formatDate(order.createdAt)}
            </span>
          </div>

          {/* User */}
          <div className="glass rounded-xl p-3 border border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden="true" />
              Utilisateur
            </p>
            <p className="font-semibold text-sm">{order.userName || '—'}</p>
            <p className="text-xs text-gray-400">{order.userEmail}</p>
          </div>

          {/* Item */}
          <div className="glass rounded-xl p-3 border border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
              <Wallet className="w-3 h-3" aria-hidden="true" />
              Article
            </p>
            <p className="font-semibold text-sm">{order.itemName}</p>
            <p className="text-emerald-300 font-bold text-base mt-1">{formatFCFA(order.amountFCFA)}</p>
            {order.type === 'pack' && (
              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                <Coins className="w-3 h-3" aria-hidden="true" />
                {order.credits.toLocaleString('fr-FR')} crédits
              </p>
            )}
          </div>

          {/* Method */}
          <div className="glass rounded-xl p-3 border border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              Méthode
            </p>
            <p className="text-sm">{order.methodLabel}</p>
            <p className="text-[11px] text-gray-400">
              <span aria-hidden="true">{countryFlag(order.country)}</span> {order.country}
            </p>
          </div>

          {/* Sender info */}
          {(order.senderName || order.senderPhone || order.transactionReference) && (
            <div className="glass rounded-xl p-3 border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Informations de paiement
              </p>
              <div className="space-y-1 text-xs">
                {order.senderName && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Expéditeur</span>
                    <span className="text-white">{order.senderName}</span>
                  </div>
                )}
                {order.senderPhone && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Téléphone</span>
                    <span className="text-white font-mono">{order.senderPhone}</span>
                  </div>
                )}
                {order.transactionReference && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Référence</span>
                    <span className="text-white font-mono text-[11px]">{order.transactionReference}</span>
                  </div>
                )}
                {order.proofUploadedAt && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Justificatif</span>
                    <span className="text-white text-[11px]">{formatDate(order.proofUploadedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proof file */}
          {proofUrl && (
            <div className="glass rounded-xl p-3 border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1">
                {isImage ? <ImageIcon className="w-3 h-3" aria-hidden="true" /> : <FileText className="w-3 h-3" aria-hidden="true" />}
                Justificatif
              </p>
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proofUrl}
                  alt="Justificatif de paiement"
                  className="rounded-lg max-h-72 w-auto border border-white/5"
                />
              ) : (
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold glass hover:bg-white/10"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  Ouvrir le PDF
                </a>
              )}
            </div>
          )}

          {/* Admin note */}
          {order.adminNote && (
            <div className="glass rounded-xl p-3 border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                Note admin
              </p>
              <p className="text-xs text-gray-300">{order.adminNote}</p>
              {order.reviewedBy && order.reviewedAt && (
                <p className="text-[10px] text-gray-500 mt-1">
                  Par {order.reviewedBy} · {formatDate(order.reviewedAt)}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {order.status === 'pending' && (
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onAction('approve')}
                disabled={actioning}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-500/15 text-green-300 border border-green-500/30 hover:bg-green-500/25 transition-colors disabled:opacity-50"
              >
                {actioning ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                )}
                Approuver
              </button>
              <button
                type="button"
                onClick={() => onAction('reject')}
                disabled={actioning}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" aria-hidden="true" />
                Rejeter
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
