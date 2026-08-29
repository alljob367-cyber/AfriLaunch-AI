'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ChecklistItem } from '@/components/dashboard/progress-checklist';
import type { Recommendation } from '@/components/dashboard/ai-recommendations';
import type { ActivityItem } from '@/components/dashboard/recent-activity';

interface DashboardData {
  checklist: ChecklistItem[];
  recommendations: Recommendation[];
  recentActivity: ActivityItem[];
}

interface User {
  id: string;
  firstName: string;
  email: string;
  plan?: string;
  planStatus?: string;
  credits?: number;
  isAdmin?: boolean;
  installedAgents?: string[];
}

interface Organization {
  id: string;
  name: string;
  industry?: string;
  country?: string;
}

interface SocialAccount {
  platform: string;
  handle: string;
  connected: boolean;
}

interface BrandKit { id: string; name: string; }
interface Site { id: string; name?: string; published?: boolean }
interface MediaKit { id: string; name?: string }
interface Conversation { id: string; agentId?: string; createdAt?: string }

// Fetch helper that tolerates network errors and returns null.
async function fetchJSON<T = any>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data as T;
  } catch {
    return null;
  }
}

// Returns the dashboard data (checklist + AI recommendations + recent activity).
// Fetches real user state from the API and builds the onboarding checklist
// based on what the user has actually done:
//   1. Créer votre organisation
//   2. Souscrire un abonnement
//   3. Configurer l'identité de marque
//   4. Générer votre site web
//   5. Connecter un réseau social
//   6. Créer du contenu
//   7. Configurer l'Agent WhatsApp
//   8. Explorer les Agents IA
//   9. Configurer le Media Kit
//   10. Inviter un membre d'équipe (TODO — no team API yet)
export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    checklist: [],
    recommendations: [],
    recentActivity: [],
  });

  const refresh = useCallback(async () => {
    // Fetch all endpoints in parallel for speed
    const [meRes, orgRes, socialRes, brandKitsRes, sitesRes, mediaKitsRes, convRes] = await Promise.all([
      fetchJSON<{ user: User }>('/api/auth/me'),
      fetchJSON<{ organization: Organization | null }>('/api/organization'),
      fetchJSON<{ accounts: SocialAccount[] }>('/api/social/accounts'),
      fetchJSON<{ kits: BrandKit[] }>('/api/brand-kit/list'),
      fetchJSON<{ sites: Site[] }>('/api/sites/list'),
      fetchJSON<{ kits: MediaKit[] }>('/api/media-kit/list'),
      fetchJSON<{ conversations: Conversation[] }>('/api/agents/conversations'),
    ]);

    const user = meRes?.user;
    const org = orgRes?.organization ?? null;
    const socialAccounts = socialRes?.accounts ?? [];
    const brandKits = brandKitsRes?.kits ?? [];
    const sites = sitesRes?.sites ?? [];
    const mediaKits = mediaKitsRes?.kits ?? [];
    const conversations = convRes?.conversations ?? [];

    const connectedSocials = socialAccounts.filter((a) => a.connected);
    const publishedSites = sites.filter((s) => s.published);

    // ─── Build the onboarding checklist (10 steps) ───
    const checklist: ChecklistItem[] = [
      {
        id: 'organization',
        label: 'Créer votre organisation',
        description: 'Configurez le nom, l\'industrie et le pays de votre business.',
        completed: !!org,
        href: '/dashboard/organization',
      },
      {
        id: 'subscription',
        label: 'Activer votre abonnement',
        description: 'Souscrivez un plan (dès 5 000 FCFA/mois) pour débloquer la plateforme.',
        completed: user?.planStatus === 'active' || user?.planStatus === 'active_trial',
        href: '/dashboard/subscription',
      },
      {
        id: 'identity',
        label: 'Générer votre identité de marque',
        description: 'Logo, palette et charte graphique créés par l\'IA.',
        completed: brandKits.length > 0,
        href: '/dashboard/identity',
      },
      {
        id: 'website',
        label: 'Générer votre site web',
        description: 'Site moderne, responsive et optimisé SEO.',
        completed: publishedSites.length > 0 || sites.length > 0,
        href: '/dashboard/website',
      },
      {
        id: 'social',
        label: 'Connecter un réseau social',
        description: 'Instagram, TikTok, Facebook, WhatsApp, LinkedIn ou X.',
        completed: connectedSocials.length > 0,
        href: '/dashboard/social',
      },
      {
        id: 'content',
        label: 'Créer votre premier contenu',
        description: 'Post, script vidéo, newsletter ou flyer généré par l\'IA.',
        completed: conversations.length > 0, // approximated by agent conversations
        href: '/dashboard/content',
      },
      {
        id: 'whatsapp-agent',
        label: 'Configurer l\'Agent WhatsApp',
        description: 'Assistant IA qui répond à vos clients 24/7 sur WhatsApp.',
        completed: false, // would need an extra fetch to /api/whatsapp-agent/config
        href: '/dashboard/whatsapp-agent',
      },
      {
        id: 'agents',
        label: 'Explorer les Agents IA',
        description: 'Discutez avec un des 13 agents spécialisés.',
        completed: conversations.length > 0,
        href: '/dashboard/agents',
      },
      {
        id: 'media-kit',
        label: 'Créer votre Media Kit',
        description: 'Bannières et visuels pour vos réseaux sociaux.',
        completed: mediaKits.length > 0,
        href: '/dashboard/media-kit',
      },
      {
        id: 'marketplace',
        label: 'Découvrir la Marketplace',
        description: 'Installez des agents communautaires pour étendre votre stack.',
        completed: (user?.installedAgents?.length ?? 0) > 0,
        href: '/dashboard/marketplace',
      },
    ];

    // ─── Recommendations based on what's missing ───
    const recommendations: Recommendation[] = [];
    if (!org) {
      recommendations.push({
        id: 'rec-org',
        category: 'growth',
        title: 'Créez votre organisation',
        rationale: 'Pour personnaliser l\'IA selon votre business et débloquer tous les modules.',
        expectedImpact: 'Toutes les générations IA seront contextuelles à votre business.',
        confidence: 95,
        action: 'Configurer',
      });
    }
    if (user?.planStatus === 'pending_payment') {
      recommendations.push({
        id: 'rec-sub',
        category: 'growth',
        title: 'Activez votre abonnement',
        rationale: 'Dès 5 000 FCFA/mois pour débloquer tous les modules et crédits IA.',
        expectedImpact: 'Accès complet à la plateforme + 500 crédits IA/mois minimum.',
        confidence: 100,
        action: 'Souscrire',
      });
    }
    if (org && brandKits.length === 0) {
      recommendations.push({
        id: 'rec-identity',
        category: 'content',
        title: 'Générez votre identité de marque',
        rationale: 'Logo + charte graphique en 30 secondes par l\'IA créative.',
        expectedImpact: 'Cohérence visuelle sur tous vos supports + gain de temps.',
        confidence: 85,
        action: 'Démarrer',
      });
    }
    if (org && sites.length === 0) {
      recommendations.push({
        id: 'rec-site',
        category: 'growth',
        title: 'Créez votre site web',
        rationale: 'Site pro, responsive, prêt à publier en 1 clic.',
        expectedImpact: 'Présence en ligne immédiate + SEO optimisé.',
        confidence: 80,
        action: 'Générer',
      });
    }
    if (org && connectedSocials.length === 0) {
      recommendations.push({
        id: 'rec-social',
        category: 'audience',
        title: 'Connectez vos réseaux sociaux',
        rationale: 'Publiez sur Instagram, TikTok, Facebook depuis un seul endroit.',
        expectedImpact: 'Économisez 5h/semaine en gestion de réseaux sociaux.',
        confidence: 75,
        action: 'Connecter',
      });
    }

    // ─── Recent activity (built from conversations + sites + brand kits) ───
    const recentActivity: ActivityItem[] = [];

    for (const conv of conversations.slice(0, 3)) {
      recentActivity.push({
        id: `conv-${conv.id}`,
        type: 'agent',
        title: 'Conversation avec un agent IA',
        description: conv.agentId ? `Agent: ${conv.agentId}` : 'Nouvelle conversation',
        timestamp: conv.createdAt || new Date().toISOString(),
        status: 'success',
      });
    }

    for (const site of sites.slice(0, 2)) {
      recentActivity.push({
        id: `site-${site.id}`,
        type: 'content_publish',
        title: site.published ? 'Site web publié' : 'Site web généré',
        description: site.name || 'Nouveau site',
        timestamp: new Date().toISOString(),
        status: 'success',
      });
    }

    for (const kit of brandKits.slice(0, 2)) {
      recentActivity.push({
        id: `kit-${kit.id}`,
        type: 'branding',
        title: 'Identité de marque créée',
        description: kit.name || 'Nouveau brand kit',
        timestamp: new Date().toISOString(),
        status: 'success',
      });
    }

    setData({ checklist, recommendations, recentActivity });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return data;
}
