// AfriLaunch AI — Parrainage module
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Gift, Loader2, Copy, Check, Users, Coins, Award,
  Share2, UserPlus, Sparkles, LogIn, Wallet, AlertCircle,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface ReferralStats {
  referralCode: string;
  referralCount: number;
  referralCreditsEarned: number;
  referredBy: string | null;
  rewardCreditsReferrer: number;
  rewardCreditsReferee: number;
  minPayoutAmount: number;
  enabled: boolean;
}

export default function ReferralPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setAuthError(false);
    setLoadError(null);
    try {
      const res = await fetch('/api/referral/stats', { credentials: 'include' });
      if (res.status === 401) {
        setAuthError(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }
      const data = await res.json();
      setStats(data as ReferralStats);
    } catch (err) {
      setLoadError((err as Error).message);
      toast({
        title: 'Erreur de chargement',
        description: (err as Error).message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function copyToClipboard(text: string, kind: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast({
        title: kind === 'code' ? 'Code copié' : 'Lien copié',
        description: kind === 'code'
          ? 'Partagez-le avec vos amis pour gagner des crédits.'
          : 'Partagez ce lien pour inviter vos amis.',
        variant: 'success',
      });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({
        title: 'Copie impossible',
        description: 'Votre navigateur a bloqué la copie. Copiez le texte manuellement.',
        variant: 'error',
      });
    }
  }

  const shareLink = stats
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${stats.referralCode}`
    : '';

  // ─── States ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" aria-hidden="true" />
          <p className="text-sm text-gray-400">Chargement du parrainage…</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen mesh-bg">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl animate-aurora" />
        </div>
        <div className="relative z-10 p-6 md:p-8 max-w-3xl mx-auto">
          <ModuleHeader
            title="Parrainage"
            description="Parrainez vos amis et gagnez des crédits IA gratuits."
            icon={Gift}
            gradient="from-emerald-500 to-green-600"
          />
          <div className="glass rounded-2xl p-8 border border-white/5">
            <EmptyState
              icon={LogIn}
              title="Connectez-vous"
              description="Vous devez être connecté pour accéder à votre code de parrainage et suivre vos récompenses."
              action={{ label: 'Se connecter', href: '/login' }}
              gradient="from-emerald-500 to-green-600"
            />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !stats) {
    return (
      <div className="min-h-screen mesh-bg">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl animate-aurora" />
        </div>
        <div className="relative z-10 p-6 md:p-8 max-w-3xl mx-auto">
          <ModuleHeader
            title="Parrainage"
            description="Parrainez vos amis et gagnez des crédits IA gratuits."
            icon={Gift}
            gradient="from-emerald-500 to-green-600"
          />
          <div className="glass rounded-2xl p-8 border border-white/5">
            <EmptyState
              icon={AlertCircle}
              title="Impossible de charger vos stats"
              description={loadError || 'Une erreur est survenue. Réessayez plus tard.'}
              action={{ label: 'Réessayer', onClick: loadData }}
              gradient="from-emerald-500 to-green-600"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!stats.enabled) {
    return (
      <div className="min-h-screen mesh-bg">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl animate-aurora" />
        </div>
        <div className="relative z-10 p-6 md:p-8 max-w-3xl mx-auto">
          <ModuleHeader
            title="Parrainage"
            description="Parrainez vos amis et gagnez des crédits IA gratuits."
            icon={Gift}
            gradient="from-emerald-500 to-green-600"
          />
          <div className="glass rounded-2xl p-8 border border-white/5">
            <EmptyState
              icon={Gift}
              title="Programme désactivé"
              description="Le programme de parrainage est actuellement désactivé. Revenez plus tard."
              gradient="from-emerald-500 to-green-600"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-green-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        <ModuleHeader
          title="Parrainage"
          description="Parrainez vos amis et gagnez des crédits IA gratuits."
          icon={Gift}
          gradient="from-emerald-500 to-green-600"
        />

        {/* ─── Hero card with referral code ─────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium mb-6 relative overflow-hidden"
          aria-labelledby="referral-hero-title"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                <Gift className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <div>
                <h2 id="referral-hero-title" className="text-lg font-bold">Votre code de parrainage</h2>
                <p className="text-xs text-gray-400">
                  Partagez-le : vous gagnez {stats.rewardCreditsReferrer} crédits, votre ami {stats.rewardCreditsReferee}.
                </p>
              </div>
            </div>

            {/* Code block */}
            <div className="flex items-stretch gap-2 mb-3">
              <div className="flex-1 glass rounded-xl px-4 py-3 border border-white/10 flex items-center justify-between">
                <code className="text-lg md:text-2xl font-mono font-bold gradient-text tracking-wider">
                  {stats.referralCode}
                </code>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(stats.referralCode, 'code')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:scale-[1.03] transition-transform shadow-lg"
                aria-label="Copier le code de parrainage"
              >
                {copied === 'code' ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    Copier
                  </>
                )}
              </button>
            </div>

            {/* Shareable link */}
            <div className="flex items-stretch gap-2">
              <div className="flex-1 glass rounded-xl px-4 py-2.5 border border-white/5 flex items-center min-w-0">
                <Share2 className="w-3.5 h-3.5 text-gray-500 mr-2 flex-shrink-0" aria-hidden="true" />
                <span className="text-xs text-gray-400 truncate font-mono">
                  {shareLink}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(shareLink, 'link')}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold glass text-white hover:bg-white/10 transition-colors"
                aria-label="Copier le lien de parrainage"
              >
                {copied === 'link' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {copied === 'link' ? 'Copié' : 'Lien'}
                </span>
              </button>
            </div>
          </div>
        </motion.section>

        {/* ─── Stats grid ────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" aria-label="Statistiques de parrainage">
          <StatCard
            icon={<Users className="w-5 h-5" aria-hidden="true" />}
            label="Filleuls parrainés"
            value={String(stats.referralCount)}
            gradient="from-emerald-500 to-green-600"
            delay={0.05}
          />
          <StatCard
            icon={<Coins className="w-5 h-5" aria-hidden="true" />}
            label="Crédits gagnés"
            value={stats.referralCreditsEarned.toLocaleString('fr-FR')}
            gradient="from-amber-500 to-orange-500"
            delay={0.1}
          />
          <StatCard
            icon={<Award className="w-5 h-5" aria-hidden="true" />}
            label="Récompense par filleul"
            value={`${stats.rewardCreditsReferrer} crédits`}
            gradient="from-indigo-500 to-violet-600"
            delay={0.15}
          />
        </section>

        {/* ─── How it works ──────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-premium mb-6"
          aria-labelledby="how-title"
        >
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h2 id="how-title" className="text-lg font-bold">Comment ça marche</h2>
          </div>
          <ol className="grid sm:grid-cols-3 gap-5 list-none p-0 m-0">
            <Step
              n={1}
              icon={<Share2 className="w-4 h-4" aria-hidden="true" />}
              title="Partagez votre code"
              description="Envoyez votre code ou lien de parrainage à vos amis entrepreneurs."
            />
            <Step
              n={2}
              icon={<UserPlus className="w-4 h-4" aria-hidden="true" />}
              title="Votre ami s'inscrit"
              description={`Il crée son compte avec votre code et reçoit ${stats.rewardCreditsReferee} crédits bonus.`}
            />
            <Step
              n={3}
              icon={<Gift className="w-4 h-4" aria-hidden="true" />}
              title="Vous recevez des crédits"
              description={`Vous gagnez ${stats.rewardCreditsReferrer} crédits dès son inscription confirmée.`}
            />
          </ol>
        </motion.section>

        {/* ─── Referred by ───────────────────────────────────────────── */}
        {stats.referredBy && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card-premium mb-6"
            aria-labelledby="referred-by-title"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                <Check className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest">
                  Vous avez été parrainé par
                </p>
                <p className="text-base font-bold font-mono mt-0.5">
                  {stats.referredBy}
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* ─── Payout threshold ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5 border border-emerald-500/20 flex items-start gap-3"
          role="note"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-200">
              Convertissez vos crédits en argent
            </p>
            <p className="text-xs text-gray-400 mt-1">
              À partir de <span className="font-bold text-emerald-400">{stats.minPayoutAmount} $</span> de crédits accumulés,
              vous pouvez demander un retrait. Plus vous parrainez, plus vite vous atteignez le seuil.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Stat card ──────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  gradient,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-premium"
    >
      <div className={cn(
        'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg mb-3',
        gradient,
      )}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">{label}</p>
    </motion.div>
  );
}

// ─── Step item ──────────────────────────────────────────────────────
function Step({
  n,
  icon,
  title,
  description,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs font-bold">
          {n}
        </span>
        <span className="text-emerald-400">{icon}</span>
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </li>
  );
}
