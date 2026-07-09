'use client';

import { useMemo } from 'react';
import type { ChecklistItem } from '@/components/dashboard/progress-checklist';
import type { Recommendation } from '@/components/dashboard/ai-recommendations';
import type { ActivityItem } from '@/components/dashboard/recent-activity';

// Aggregates mock dashboard data: checklist + AI recs + activity feed.
export function useDashboardData<T = {
  checklist: ChecklistItem[];
  recommendations: Recommendation[];
  recentActivity: ActivityItem[];
}>(): T {
  const data = useMemo(() => {
    const checklist: ChecklistItem[] = [
      { id: '1', label: 'Créer votre organisation', description: 'Nommez votre business', completed: true, href: '/dashboard/organization' },
      { id: '2', label: 'Générer votre identité', description: 'Logo + charte graphique', completed: true, href: '/dashboard/identity' },
      { id: '3', label: 'Lancer votre site web', description: 'Landing page prête', completed: false, href: '/dashboard/website' },
      { id: '4', label: 'Connecter les réseaux sociaux', description: 'Au moins 2 comptes', completed: false, href: '/dashboard/social' },
      { id: '5', label: 'Créer votre premier contenu', description: 'Post ou vidéo IA', completed: false, href: '/dashboard/content' },
      { id: '6', label: 'Activer les paiements', description: 'Mobile Money ou carte', completed: false, href: '/dashboard/payments' },
      { id: '7', label: 'Lancer un agent IA', description: 'Branding, Content, etc.', completed: false, href: '/dashboard/agents' },
      { id: '8', label: 'Planifier une campagne', description: 'Pub ou newsletter', completed: false, href: '/dashboard/campaigns' },
      { id: '9', label: 'Configurer l\'analytics', description: 'Connecter vos sources', completed: false, href: '/dashboard/analytics' },
      { id: '10', label: 'Inviter votre équipe', description: 'Membres & rôles', completed: false, href: '/dashboard/team' },
    ];

    const recommendations: Recommendation[] = [
      {
        id: '1',
        category: 'timing',
        title: 'Publiez sur TikTok à 19h30 (GMT)',
        rationale: 'Vos abonnés africains sont 3× plus actifs entre 19h et 21h. Votre dernier post à 14h n\'a atteint que 23% de votre audience potentielle.',
        expectedImpact: '+180% de portée estimée',
        confidence: 92,
        action: 'Programmer un post',
      },
      {
        id: '2',
        category: 'content',
        title: 'Créez une série "Coulisses de mon business"',
        rationale: 'Les contenus behind-the-scène génèrent 2.4× plus d\'engagement dans votre secteur. Aucun post de ce type publié ce mois-ci.',
        expectedImpact: '+85% d\'interactions',
        confidence: 87,
        action: 'Générer avec Content Agent',
      },
      {
        id: '3',
        category: 'growth',
        title: 'Ciblez le marché ivoirien',
        rationale: 'Vos 3 concurrents directs voient une croissance de +340% en Côte d\'Ivoire. Aucune campagne n\'y est actuellement active.',
        expectedImpact: '+1 200 abonnés / mois',
        confidence: 78,
        action: 'Lancer une campagne',
      },
      {
        id: '4',
        category: 'audience',
        title: 'Réengagez 847 abonnés inactifs',
        rationale: '847 abonnés n\'ont pas interagi depuis 30 jours. Une séquence email automatique pourrait en récupérer 30-40%.',
        expectedImpact: '+340 abonnés récupérés',
        confidence: 71,
        action: 'Créer la séquence',
      },
    ];

    const recentActivity: ActivityItem[] = [
      { id: '1', type: 'branding', title: 'Nouveau logo généré', description: 'Par le Branding Agent — 4 variants', timestamp: 'Il y a 12 min', status: 'success' },
      { id: '2', type: 'social', title: 'Post publié sur Instagram', description: '+142 likes en 1h', timestamp: 'Il y a 1 h', status: 'success' },
      { id: '3', type: 'audience', title: '+47 abonnés TikTok', description: 'Pic d\'engagement sur la vidéo "Lancement"', timestamp: 'Il y a 3 h', status: 'success' },
      { id: '4', type: 'payment', title: 'Paiement reçu — Orange Money', description: '12 500 FCFA — Commande #4821', timestamp: 'Il y a 4 h', status: 'success' },
      { id: '5', type: 'content_publish', title: 'Newsletter programmée', description: 'Envoi demain à 09h00 (1 240 abonnés)', timestamp: 'Il y a 5 h', status: 'warning' },
      { id: '6', type: 'agent', title: 'Growth Agent a trouvé 3 opportunités', description: 'Nouveau créneau sur TikTok Afrique de l\'Ouest', timestamp: 'Il y a 7 h', status: 'success' },
    ];

    return { checklist, recommendations, recentActivity } as T;
  }, []);

  return data;
}
