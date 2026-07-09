// AfriLaunch AI — Features Section
'use client';

import { motion } from 'framer-motion';
import {
  Palette, Globe, Share2, Bot, CreditCard, BarChart3,
  PenSquare, Megaphone, Shield,
} from 'lucide-react';

const features = [
  {
    icon: Palette,
    title: 'Identité de marque IA',
    description: 'Générez votre nom, logo, palette et charte graphique en quelques minutes. Notre IA branding adapte tout au marché africain.',
    gradient: 'from-violet-500 to-purple-600',
    points: ['Logo vectoriel', 'Palette panafricaine', 'Charte complète'],
  },
  {
    icon: Globe,
    title: 'Site web instantané',
    description: 'Landing pages, boutiques e-commerce et sites vitrines créés par IA. Hébergement inclus, optimisés mobile-first pour l\'Afrique.',
    gradient: 'from-blue-500 to-cyan-600',
    points: ['No-code', 'SEO optimisé', 'Paiements locaux'],
  },
  {
    icon: PenSquare,
    title: 'Studio de contenu',
    description: 'Posts, reels, flyers, scripts vidéo et newsletters. 50+ formats pré-configurés pour chaque réseau social africain.',
    gradient: 'from-pink-500 to-rose-600',
    points: ['50+ formats', 'Multilingue (FR, EN, SW, AR)', 'Calendrier auto'],
  },
  {
    icon: Share2,
    title: 'Réseaux sociaux',
    description: 'Connectez et gérez WhatsApp Business, Instagram, TikTok, Facebook, LinkedIn et X depuis un seul tableau de bord.',
    gradient: 'from-green-500 to-emerald-600',
    points: ['6 réseaux', 'Publication auto', 'Boîte de réception unifiée'],
  },
  {
    icon: Bot,
    title: '13 Agents IA spécialisés',
    description: 'Branding, contenu, SEO, ads, support client, analytics... Chaque agent a une expertise métier africaine.',
    gradient: 'from-indigo-500 to-violet-600',
    points: ['Multilingues', 'Contexte local', 'Apprentissage continu'],
  },
  {
    icon: CreditCard,
    title: 'Paiements intégrés',
    description: 'Acceptez Mobile Money (Orange, MTN, Moov), Wave, cartes bancaires et PayPal. Cartes virtuelles pour vos dépenses.',
    gradient: 'from-teal-500 to-green-600',
    points: ['Mobile Money', 'Cartes virtuelles', 'Paiements en masse'],
  },
  {
    icon: BarChart3,
    title: 'Analytics prédictifs',
    description: 'Suivez portée, engagement, conversions et ROI. L\'IA prédit vos meilleurs moments de publication et opportunités.',
    gradient: 'from-sky-500 to-blue-600',
    points: ['Tableau temps réel', 'Prédictions IA', 'Rapports PDF'],
  },
  {
    icon: Megaphone,
    title: 'Campagnes marketing',
    description: 'Lancez et pilotez vos publicités Meta, TikTok et Google Ads. L\'IA optimise le ciblage et le budget automatiquement.',
    gradient: 'from-orange-500 to-amber-600',
    points: ['Meta & TikTok Ads', 'Optimisation IA', 'A/B testing auto'],
  },
  {
    icon: Shield,
    title: 'Sécurité & conformité',
    description: 'Chiffrement bout-en-bout, RGPD et conformité data locale. Vos données et celles de vos clients restent protégées.',
    gradient: 'from-slate-500 to-gray-600',
    points: ['RGPD ready', 'Data residency', '2FA + SSO'],
  },
];

export function FeaturesSection() {
  return (
    <section id="fonctionnalités" className="py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-6">
            <span className="badge-new">TOUT EN UN</span>
            <span className="text-sm text-gray-400">9 modules intégrés</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Une seule plateforme.
            <br />
            <span className="gradient-text">Tout votre digital.</span>
          </h2>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto">
            Remplacez 15 outils par une seule plateforme conçue pour les réalités
            du marché africain — du branding au paiement, en passant par l'IA.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1, type: 'spring', stiffness: 200, damping: 22 }}
              className="group glass rounded-3xl p-8 border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient}
                              flex items-center justify-center mb-6 shadow-lg
                              group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">{feature.description}</p>

              <ul className="space-y-2">
                {feature.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-gray-300">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.gradient}`} />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
