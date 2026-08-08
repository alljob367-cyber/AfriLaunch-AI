// AfriLaunch AI — Marketplace d'agents module
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Store, Loader2, Check, Star, Download, LogIn, Sparkles,
  AlertCircle, Search,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface MarketplaceAgent {
  id: string;
  name: string;
  author: string;
  description: string;
  category: string;
  priceMonthly: number;
  icon: string;
  color: string;
  rating: number;
  installs: number;
  featured: boolean;
}

interface FullUser {
  id: string;
  firstName: string;
  email: string;
  installedAgents: string[];
}

type FilterTab = 'all' | 'featured' | string;

function formatInstalls(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return String(n);
}

export default function MarketplacePage() {
  const { toast } = useToast();
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [installedAgents, setInstalledAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setAuthError(false);
    try {
      const [agentsRes, meRes] = await Promise.all([
        fetch('/api/marketplace/agents', { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' }),
      ]);

      if (agentsRes.ok) {
        const data = await agentsRes.json();
        setAgents((data.agents ?? []) as MarketplaceAgent[]);
      } else {
        throw new Error(`Erreur marketplace ${agentsRes.status}`);
      }

      if (meRes.status === 401) {
        setAuthError(true);
      } else if (meRes.ok) {
        const meData = await meRes.json();
        setInstalledAgents(meData.user?.installedAgents ?? []);
      }
    } catch (err) {
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

  // Categories derived from agents
  const categories = useMemo(() => {
    const set = new Set<string>();
    agents.forEach((a) => set.add(a.category));
    return Array.from(set);
  }, [agents]);

  const filteredAgents = useMemo(() => {
    let list = agents;
    if (activeFilter === 'featured') {
      list = list.filter((a) => a.featured);
    } else if (activeFilter !== 'all') {
      list = list.filter((a) => a.category === activeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q),
      );
    }
    return list;
  }, [agents, activeFilter, search]);

  async function handleInstall(agent: MarketplaceAgent) {
    if (authError) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour installer des agents.',
        variant: 'warning',
      });
      return;
    }
    if (installedAgents.includes(agent.id)) return;

    setInstallingId(agent.id);
    try {
      const res = await fetch('/api/marketplace/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId: agent.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Installation impossible');
      }
      const newInstalled = data.user?.installedAgents ?? [...installedAgents, agent.id];
      setInstalledAgents(newInstalled);
      toast({
        title: 'Agent installé !',
        description: `${agent.name} est désormais disponible dans votre tableau de bord.`,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: (err as Error).message,
        variant: 'error',
      });
    } finally {
      setInstallingId(null);
    }
  }

  // ─── States ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-pink-400 animate-spin" aria-hidden="true" />
          <p className="text-sm text-gray-400">Chargement de la marketplace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-pink-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-rose-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Marketplace d'agents"
          description="Découvrez et installez des agents IA premium créés par la communauté africaine."
          icon={Store}
          gradient="from-pink-500 to-rose-600"
        />

        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 p-4 rounded-xl glass border border-amber-500/30 text-sm"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" aria-hidden="true" />
            <span className="text-gray-300">
              Connectez-vous pour installer des agents. Vous pouvez consulter la marketplace sans compte.
            </span>
            <a
              href="/login"
              className="ml-auto inline-flex items-center gap-1.5 text-pink-400 hover:underline font-semibold"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              Connexion
            </a>
          </motion.div>
        )}

        {/* Search bar */}
        {agents.length > 0 && (
          <div className="relative mb-5">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un agent, un auteur, une catégorie…"
              aria-label="Rechercher dans la marketplace"
              className="w-full glass rounded-xl pl-11 pr-4 py-3 border border-white/5 focus:border-pink-500/50 outline-none text-sm placeholder:text-gray-500"
            />
          </div>
        )}

        {/* Filter tabs */}
        {agents.length > 0 && (
          <div
            className="flex flex-wrap gap-2 mb-6"
            role="tablist"
            aria-label="Filtrer par catégorie"
          >
            <FilterButton
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
              label="Tous"
              count={agents.length}
            />
            <FilterButton
              active={activeFilter === 'featured'}
              onClick={() => setActiveFilter('featured')}
              label="Featured"
              icon={<Sparkles className="w-3 h-3" aria-hidden="true" />}
              count={agents.filter((a) => a.featured).length}
            />
            {categories.map((cat) => (
              <FilterButton
                key={cat}
                active={activeFilter === cat}
                onClick={() => setActiveFilter(cat)}
                label={cat}
                count={agents.filter((a) => a.category === cat).length}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {agents.length === 0 ? (
          <div className="glass rounded-2xl p-8 border border-white/5">
            <EmptyState
              icon={Store}
              title="Aucun agent dans la marketplace pour le moment"
              description="Les agents créés par la communauté africaine apparaîtront ici. Revenez bientôt pour découvrir de nouveaux outils IA."
              gradient="from-pink-500 to-rose-600"
            />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="glass rounded-2xl p-8 border border-white/5">
            <EmptyState
              icon={Search}
              title="Aucun résultat"
              description="Aucun agent ne correspond à votre recherche. Essayez un autre terme ou catégorie."
              gradient="from-pink-500 to-rose-600"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent, idx) => {
              const isInstalled = installedAgents.includes(agent.id);
              const isInstalling = installingId === agent.id;
              return (
                <motion.article
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                  className="card-premium flex flex-col"
                  aria-labelledby={`agent-${agent.id}-name`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-lg flex-shrink-0',
                        agent.color,
                      )}
                      role="img"
                      aria-hidden="true"
                    >
                      <span>{agent.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          id={`agent-${agent.id}-name`}
                          className="font-bold text-sm truncate"
                        >
                          {agent.name}
                        </h3>
                        {agent.featured && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white flex-shrink-0"
                            title="Agent en vedette"
                          >
                            <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        @{agent.author}
                      </p>
                    </div>
                  </div>

                  {/* Rating + installs */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" aria-hidden="true" />
                      <span className="font-semibold text-gray-200">{agent.rating.toFixed(1)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      {formatInstalls(agent.installs)} installs
                    </span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-500">
                      {agent.category}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2 flex-1">
                    {agent.description}
                  </p>

                  {/* Price + action */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                    <div>
                      <p className="text-base font-bold">
                        {agent.priceMonthly === 0
                          ? 'Gratuit'
                          : `${agent.priceMonthly.toFixed(2)} $`}
                      </p>
                      {agent.priceMonthly > 0 && (
                        <p className="text-[10px] text-gray-500">/ mois</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInstall(agent)}
                      disabled={isInstalled || isInstalling}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all',
                        isInstalled
                          ? 'bg-green-500/15 text-green-400 border border-green-500/30 cursor-default'
                          : 'bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:scale-[1.03] shadow-lg disabled:opacity-70 disabled:hover:scale-100',
                      )}
                      aria-label={
                        isInstalled
                          ? `${agent.name} est installé`
                          : `Installer ${agent.name}`
                      }
                    >
                      {isInstalling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : isInstalled ? (
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      {isInstalled ? 'Installé' : 'Installer'}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Filter button ──────────────────────────────────────────────────
function FilterButton({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
        active
          ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg'
          : 'glass text-gray-400 hover:text-white hover:bg-white/10',
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          'text-[10px] px-1.5 py-0.5 rounded-full',
          active ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500',
        )}
      >
        {count}
      </span>
    </button>
  );
}
