// AfriLaunch AI — Recent deliverables widget (brand kits + published sites)
// Shows on the dashboard "Vue d'ensemble" so the user can track what's being
// generated and what's ready to download/publish/share.

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Palette, Globe, Loader2, Check, AlertCircle, ChevronRight, Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandKitSummary {
  id: string;
  businessName: string;
  status: string;
  progress: { done: number; total: number; percent: number };
  createdAt: number;
}

interface PublishedSiteSummary {
  id: string;
  slug: string;
  title: string;
  url: string;
  views: number;
  createdAt: number;
}

export function RecentDeliverables() {
  const [kits, setKits] = useState<BrandKitSummary[]>([]);
  const [sites, setSites] = useState<PublishedSiteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [kitsRes, sitesRes] = await Promise.all([
        fetch('/api/brand-kit/list', { credentials: 'include' }),
        fetch('/api/sites/list', { credentials: 'include' }),
      ]);
      const [kitsData, sitesData] = await Promise.all([kitsRes.json(), sitesRes.json()]);
      if (kitsData.ok) setKits(kitsData.kits.slice(0, 3));
      if (sitesData.ok) setSites(sitesData.sites.slice(0, 3));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    // Poll every 5s if there's a running kit
    const id = setInterval(() => {
      setKits((prev) => {
        if (prev.some((k) => k.status === 'running' || k.status === 'pending')) {
          fetchAll();
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" aria-hidden="true" />
      </div>
    );
  }

  if (kits.length === 0 && sites.length === 0) {
    return (
      <div className="text-center py-8">
        <ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" aria-hidden="true" />
        <p className="text-xs text-gray-500">Aucun livrable pour le moment.</p>
        <p className="text-[11px] text-gray-600 mt-1">
          Générez un <Link href="/dashboard/identity" className="text-violet-400 hover:underline">kit de marque</Link> ou un{' '}
          <Link href="/dashboard/website" className="text-blue-400 hover:underline">site web</Link> pour les voir ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Brand kits */}
      {kits.map((kit) => (
        <Link
          key={kit.id}
          href="/dashboard/identity"
          className="flex items-center gap-3 p-3 rounded-xl glass border border-white/5 hover:border-violet-500/30 transition-colors group"
        >
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            kit.status === 'done' ? 'bg-emerald-500/20' : 'bg-violet-500/20',
          )}>
            {kit.status === 'done'
              ? <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              : <Loader2 className="w-4 h-4 animate-spin text-violet-400" aria-hidden="true" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{kit.businessName}</p>
            <p className="text-[10px] text-gray-500">
              Kit de marque · {kit.progress.done}/{kit.progress.total} livrables
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all"
                style={{ width: `${kit.progress.percent}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 w-8 text-right">{kit.progress.percent}%</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors flex-shrink-0" aria-hidden="true" />
        </Link>
      ))}

      {/* Published sites */}
      {sites.map((site) => (
        <a
          key={site.id}
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl glass border border-white/5 hover:border-emerald-500/30 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
            <Globe className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{site.title}</p>
            <p className="text-[10px] text-gray-500 truncate">
              Site publié · {site.url.replace(/^https?:\/\//, '')}
            </p>
          </div>
          <span className="text-[10px] text-gray-500 flex items-center gap-1 flex-shrink-0">
            👁️ {site.views}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors flex-shrink-0" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
