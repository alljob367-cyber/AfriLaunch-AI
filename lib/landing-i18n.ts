// AfriLaunch AI — Landing page translations (FR/EN)
// Used by app/(marketing)/page.tsx for the bilingual switcher.

export type Lang = 'fr' | 'en';

export interface LandingStrings {
  // Nav
  nav_features: string;
  nav_agents: string;
  nav_pricing: string;
  nav_usecases: string;
  nav_faq: string;
  nav_login: string;
  nav_cta: string;

  // Hero
  hero_badge: string;
  hero_title_1: string;
  hero_title_2: string;
  hero_subtitle: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  hero_note: string;

  // Stats
  stats_users: string;
  stats_countries: string;
  stats_agents: string;
  stats_uptime: string;

  // Press strip
  press_title: string;

  // Demo
  demo_badge: string;
  demo_title: string;
  demo_subtitle: string;

  // Agents
  agents_badge: string;
  agents_title: string;
  agents_subtitle: string;

  // Features
  features_badge: string;
  features_title: string;
  features_subtitle: string;
  features: Array<{ title: string; desc: string }>;

  // Use cases
  usecases_badge: string;
  usecases_title: string;
  usecases_subtitle: string;
  usecases: Array<{ sector: string; title: string; desc: string; metric: string }>;

  // Comparison
  compare_badge: string;
  compare_title: string;
  compare_subtitle: string;
  compare_col_us: string;
  compare_col_chatgpt: string;
  compare_col_canva: string;
  compare_col_buffer: string;
  compare_features: Array<{ label: string; us: string | boolean; chatgpt: string | boolean; canva: string | boolean; buffer: string | boolean }>;

  // Pricing
  pricing_badge: string;
  pricing_title: string;
  pricing_subtitle: string;
  pricing_month: string;
  pricing_popular: string;
  pricing_plans: Array<{
    name: string;
    price: string;
    desc: string;
    features: string[];
    cta: string;
    popular?: boolean;
  }>;
  pricing_note: string;

  // Social proof
  proof_badge: string;
  proof_title: string;
  proof_subtitle: string;
  proof_testimonials: Array<{ initials: string; name: string; country: string; quote: string; metric: string }>;

  // FAQ
  faq_badge: string;
  faq_title: string;
  faq_subtitle: string;
  faq_items: Array<{ q: string; a: string }>;

  // Final CTA
  cta_title: string;
  cta_subtitle: string;
  cta_button: string;
  cta_note: string;

  // Footer
  footer_tagline: string;
  footer_slogan: string;
  footer_product: string;
  footer_modules: string;
  footer_resources: string;
  footer_company: string;
  footer_legal: string;
  footer_newsletter_title: string;
  footer_newsletter_desc: string;
  footer_newsletter_placeholder: string;
  footer_newsletter_button: string;
  footer_newsletter_consent: string;
  footer_newsletter_success: string;
  footer_contact: string;
  footer_follow_us: string;
  footer_payments: string;
  footer_rights: string;
  footer_made_in: string;
  footer_back_to_top: string;
  footer_lang: string;
  footer_status: string;
  footer_status_ok: string;

  // Footer link labels (modules / resources / company / legal)
  footer_l_features: string;
  footer_l_agents: string;
  footer_l_pricing: string;
  footer_l_usecases: string;
  footer_l_faq: string;
  footer_l_demo: string;

  footer_l_identity: string;
  footer_l_brand_kit: string;
  footer_l_website: string;
  footer_l_content: string;
  footer_l_social: string;
  footer_l_whatsapp: string;
  footer_l_voice: string;
  footer_l_analytics: string;
  footer_l_payments: string;
  footer_l_my_agents: string;
  footer_l_marketplace: string;

  footer_l_blog: string;
  footer_l_docs: string;
  footer_l_api: string;
  footer_l_help: string;
  footer_l_community: string;
  footer_l_changelog: string;
  footer_l_status: string;
  footer_l_webinars: string;

  footer_l_about: string;
  footer_l_careers: string;
  footer_l_partners: string;
  footer_l_press: string;
  footer_l_contact: string;

  footer_l_terms: string;
  footer_l_privacy: string;
  footer_l_security: string;
  footer_l_rgpd: string;
  footer_l_cookies: string;
}

export const STRINGS: Record<Lang, LandingStrings> = {
  fr: {
    nav_features: 'Fonctionnalités',
    nav_agents: 'Agents IA',
    nav_pricing: 'Tarifs',
    nav_usecases: 'Cas d\'usage',
    nav_faq: 'FAQ',
    nav_login: 'Connexion',
    nav_cta: 'Commencer',

    hero_badge: 'Propulsé par 13 agents IA spécialisés',
    hero_title_1: 'L\'empire digital de votre business,',
    hero_title_2: 'géré par l\'IA.',
    hero_subtitle: 'AfriLaunch AI centralise branding, site web, contenu, réseaux sociaux et paiements Mobile Money. 13 agents IA travaillent 24/7 pendant que vous scalez.',
    hero_cta_primary: 'Démarrer maintenant',
    hero_cta_secondary: 'Voir la démo',
    hero_note: 'Paiement Mobile Money · Activation en 24h · Sans engagement',

    stats_users: 'Entrepreneurs actifs',
    stats_countries: 'Pays africains',
    stats_agents: 'Agents IA',
    stats_uptime: 'Uptime garanti',

    press_title: 'Ils parlent de nous',

    demo_badge: 'Aperçu produit',
    demo_title: 'Un dashboard. Tout votre business.',
    demo_subtitle: 'Pilotez vos 13 agents IA, votre contenu, vos réseaux et vos paiements depuis une seule interface — pensée pour les réalités africaines.',

    agents_badge: '13 agents IA',
    agents_title: 'Une équipe d\'experts, disponible 24/7.',
    agents_subtitle: 'Chaque agent est un expert métier formé sur les réalités du marché africain. Ils se souviennent de votre business et travaillent en contexte.',

    features_badge: 'Fonctionnalités',
    features_title: 'Tout ce dont votre business a besoin.',
    features_subtitle: 'Une plateforme unifiée qui remplace 10 outils. Du branding au paiement, en passant par le contenu et les réseaux sociaux.',
    features: [
      { title: 'Identité de marque IA', desc: 'Logos, palettes, charte graphique générés en 30 secondes par notre IA créative.' },
      { title: 'Site web instantané', desc: 'Un site moderne, responsive et optimisé SEO, prêt à publier en 1 clic.' },
      { title: 'Studio de contenu', desc: 'Posts, scripts vidéo, newsletters et flyers créés automatiquement par l\'IA.' },
      { title: 'Réseaux sociaux unifiés', desc: 'Connectez Instagram, TikTok, Facebook, WhatsApp, LinkedIn et X en un seul endroit.' },
      { title: 'Paiements Mobile Money', desc: 'Acceptez MTN MoMo, Orange Money, Wave et virement. Cash-out en 24h.' },
      { title: 'WhatsApp Agent IA', desc: 'Un assistant IA qui répond à vos clients 24/7 sur WhatsApp, dans 5 langues.' },
      { title: 'Analytics prédictifs', desc: 'Anticipez vos ventes et tendances grâce à l\'IA prédictive et aux benchmarks locaux.' },
      { title: 'Campagnes marketing', desc: 'Lancez des campagnes Google, Meta et TikTok optimisées automatiquement par l\'IA.' },
    ],

    usecases_badge: 'Cas d\'usage',
    usecases_title: 'Conçu pour chaque business africain.',
    usecases_subtitle: 'Que vous soyez restaurateur à Douala, e-commerçant à Lagos ou freelance à Dakar — AfriLaunch AI s\'adapte à votre réalité.',
    usecases: [
      { sector: 'Restaurant', title: 'Remplissez vos tables, tous les soirs.', desc: 'Site avec menu en ligne, réservations WhatsApp, posts Instagram quotidiens et campagnes Meta Ads géolocalisées.', metric: '+47% de réservations' },
      { sector: 'E-commerce', title: 'Vendez plus, avec moins d\'efforts.', desc: 'Boutique en ligne, fiches produits optimisées SEO, paiements Mobile Money et réponses client automatiques.', metric: '+320% de ventes' },
      { sector: 'Freelance', title: 'Décuplez votre productivité.', desc: 'Propals, contrats, factures, contenu pour clients — l\'IA gère l\'admin pendant que vous facturez.', metric: '15h gagnées/semaine' },
      { sector: 'Startup', title: 'Lancez plus vite, scalez plus loin.', desc: 'Identité de marque, landing page, stratégie growth et investisseurs — votre stack complète de zéro à scale.', metric: 'MVP en 7 jours' },
    ],

    compare_badge: 'Comparatif',
    compare_title: 'Pourquoi choisir AfriLaunch AI ?',
    compare_subtitle: 'Une seule plateforme vs 4 abonnements séparés. Fait pour l\'Afrique, pensé pour le ROI.',
    compare_col_us: 'AfriLaunch AI',
    compare_col_chatgpt: 'ChatGPT',
    compare_col_canva: 'Canva',
    compare_col_buffer: 'Buffer',
    compare_features: [
      { label: '13 agents IA spécialisés', us: true, chatgpt: '1 chat générique', canva: false, buffer: false },
      { label: 'Mémoire du business (contexte)', us: true, chatgpt: false, canva: false, buffer: false },
      { label: 'Génération de site web complet', us: true, chatgpt: 'Partiel', canva: false, buffer: false },
      { label: 'Publication multi-réseaux', us: true, chatgpt: false, canva: 'Partiel', buffer: true },
      { label: 'Paiements Mobile Money (FCFA)', us: true, chatgpt: false, canva: false, buffer: false },
      { label: 'WhatsApp Agent IA', us: true, chatgpt: false, canva: false, buffer: false },
      { label: 'Adapté au marché africain', us: true, chatgpt: false, canva: false, buffer: false },
      { label: 'Prix en FCFA', us: '5 000 FCFA', chatgpt: '$20 USD', canva: '$15 USD', buffer: '$12 USD' },
    ],

    pricing_badge: 'Tarifs',
    pricing_title: 'Des prix pensés pour l\'Afrique.',
    pricing_subtitle: 'En FCFA. Paiement Mobile Money ou virement. Activation en 24h. Pas de carte bancaire requise.',
    pricing_month: '/mois',
    pricing_popular: 'Le plus populaire',
    pricing_plans: [
      { name: 'Starter', price: '5 000', desc: 'Pour démarrer', features: ['13 agents IA', 'Site web basique', '2 réseaux sociaux', '500 crédits IA/mois', 'Support email 48h'], cta: 'Commencer' },
      { name: 'Pro', price: '15 000', desc: 'Pour grow', popular: true, features: ['13 agents IA', 'Site web premium + domaine', '5 réseaux sociaux', '5 000 crédits IA/mois', 'WhatsApp Agent IA', 'Analytics avancés', 'Support prioritaire 24h'], cta: 'Choisir Pro' },
      { name: 'Business', price: '40 000', desc: 'Pour scale', features: ['13 agents IA', 'Site e-commerce + publication', '6 réseaux sociaux', '50 000 crédits IA/mois', 'Multi-utilisateurs (20)', 'API complète', 'Account manager dédié'], cta: 'Choisir Business' },
      { name: 'Enterprise', price: '150 000', desc: 'Sur-mesure', features: ['Agents illimités', 'Infrastructure dédiée', 'Crédits illimités', 'SLA 99.99%', 'Intégrations sur-mesure', 'SSO & sécurité avancée', 'Support 24/7 dédié'], cta: 'Nous contacter' },
    ],
    pricing_note: 'Tous les prix sont en FCFA (XOF). Paiement Mobile Money (MTN, Orange, Wave) ou virement bancaire.',

    proof_badge: 'Témoignages',
    proof_title: 'Ils scalent avec AfriLaunch AI.',
    proof_subtitle: 'Des entrepreneurs africains qui ont transformé leur business grâce à l\'IA.',
    proof_testimonials: [
      { initials: 'AK', name: 'Aïcha Kone', country: 'Côte d\'Ivoire', quote: 'En 2 semaines, j\'ai lancé ma boutique en ligne avec logo, site et paiements Mobile Money. Incroyable.', metric: '+320% de ventes' },
      { initials: 'MO', name: 'Marcus Okafor', country: 'Nigeria', quote: 'Les agents IA gèrent mon SEO et mes campagnes Ads. Mon ROAS est passé de 1.8 à 4.2 en un mois.', metric: 'ROAS 4.2x' },
      { initials: 'ND', name: 'Nadia Diallo', country: 'Sénégal', quote: 'Le WhatsApp Agent répond à mes clients jour et nuit. Je dors, mon business continue de tourner.', metric: 'Support 24/7' },
      { initials: 'BM', name: 'Boubacar Mbaye', country: 'Mali', quote: 'Le Content Agent produit mes posts Instagram en 10 secondes. Je gagne 15h par semaine.', metric: '15h/semaine' },
    ],

    faq_badge: 'FAQ',
    faq_title: 'Questions fréquentes.',
    faq_subtitle: 'Tout ce que vous devez savoir avant de commencer.',
    faq_items: [
      { q: 'Comment fonctionne le paiement ?', a: 'Vous payez en FCFA via Mobile Money (MTN MoMo, Orange Money, Wave) ou virement bancaire. Téléversez votre preuve de paiement, notre équipe active votre compte sous 24h.' },
      { q: 'Y a-t-il un essai gratuit ?', a: 'Non — AfriLaunch AI est un service premium. Vous devez souscrire un abonnement pour utiliser la plateforme. Le plan Starter à 5 000 FCFA/mois est le point d\'entrée le plus accessible. Activation en 24h via Mobile Money.' },
      { q: 'L\'IA comprend-elle le contexte africain ?', a: 'Oui. Nos 13 agents IA sont formés sur les réalités du marché africain : habitudes d\'achat (Mobile Money, paiement à la livraison), langues locales (wolof, swahili, yoruba), références culturelles et benchmarks par pays.' },
      { q: 'Mes données sont-elles sécurisées ?', a: 'Vos données sont stockées sur Supabase (PostgreSQL) avec chiffrement et RLS (Row-Level Security). Vos conversations avec les agents IA sont privées et ne sont jamais partagées. Conforme RGPD.' },
      { q: 'Puis-je changer de plan ou résilier ?', a: 'Oui, à tout moment depuis votre dashboard. Vous pouvez upgrader, downgrader ou résilier en 1 clic. Les crédits déjà payés restent disponibles jusqu\'à la fin de la période en cours.' },
      { q: 'Quels réseaux sociaux sont supportés ?', a: 'Instagram, TikTok, Facebook, WhatsApp Business, LinkedIn et X (Twitter). Vous connectez vos comptes en 1 clic, puis publiez ou planifiez depuis le module Contenu.' },
      { q: 'L\'app fonctionne-t-elle hors ligne ?', a: 'L\'app nécessite une connexion internet. Cependant, c\'est une PWA (Progressive Web App) — vous pouvez l\'installer sur votre téléphone et y accéder comme une app native. Les sites générés sont hébergés en ligne et accessibles 24/7.' },
      { q: 'Quel support est disponible ?', a: 'Plan Starter : email (réponse sous 48h). Plan Pro : email prioritaire (24h) + chat. Plan Business : account manager dédié + Slack. Plan Enterprise : support 24/7 dédié + SLA 99.99%.' },
    ],

    cta_title: 'Prêt à scaler votre business ?',
    cta_subtitle: 'Rejoignez les entrepreneurs africains qui utilisent l\'IA pour gagner du temps, vendre plus et grandir plus vite.',
    cta_button: 'Créer mon compte',
    cta_note: 'Activation en 24h · Paiement Mobile Money · Sans engagement',

    footer_tagline: 'L\'empire digital de votre business, géré par l\'IA.',
    footer_slogan: 'LANCEZ. GÉREZ. DÉVELOPPEZ.',
    footer_product: 'Produit',
    footer_modules: 'Modules',
    footer_resources: 'Ressources',
    footer_company: 'Entreprise',
    footer_legal: 'Légal',
    footer_newsletter_title: 'Restez à la pointe de l\'entrepreneuriat africain',
    footer_newsletter_desc: 'Recevez nos guides, études de cas et nouveautés produit. 1 email par semaine, jamais de spam.',
    footer_newsletter_placeholder: 'votre@email.com',
    footer_newsletter_button: 'S\'abonner',
    footer_newsletter_consent: 'En vous abonnant, vous acceptez notre politique de confidentialité.',
    footer_newsletter_success: 'Merci ! Vérifiez votre boîte mail pour confirmer.',
    footer_contact: 'Contact',
    footer_follow_us: 'Suivez-nous',
    footer_payments: 'Paiements acceptés',
    footer_rights: 'Tous droits réservés.',
    footer_made_in: 'Conçu avec ❤️ en Afrique',
    footer_back_to_top: 'Haut de page',
    footer_lang: 'Langue',
    footer_status: 'Statut système',
    footer_status_ok: 'Opérationnel',

    footer_l_features: 'Fonctionnalités',
    footer_l_agents: 'Agents IA',
    footer_l_pricing: 'Tarifs',
    footer_l_usecases: 'Cas d\'usage',
    footer_l_faq: 'FAQ',
    footer_l_demo: 'Démo live',

    footer_l_identity: 'Identité de marque',
    footer_l_brand_kit: 'Brand Kit',
    footer_l_website: 'Site web',
    footer_l_content: 'Contenu',
    footer_l_social: 'Réseaux sociaux',
    footer_l_whatsapp: 'Agent WhatsApp',
    footer_l_voice: 'Voix IA',
    footer_l_analytics: 'Analytics',
    footer_l_payments: 'Paiements',
    footer_l_my_agents: 'Mes agents',
    footer_l_marketplace: 'Marketplace',

    footer_l_blog: 'Blog',
    footer_l_docs: 'Documentation',
    footer_l_api: 'API Docs',
    footer_l_help: 'Centre d\'aide',
    footer_l_community: 'Communauté',
    footer_l_changelog: 'Changelog',
    footer_l_status: 'Statut système',
    footer_l_webinars: 'Webinaires',

    footer_l_about: 'À propos',
    footer_l_careers: 'Carrières',
    footer_l_partners: 'Partenaires',
    footer_l_press: 'Presse',
    footer_l_contact: 'Nous contacter',

    footer_l_terms: 'Conditions d\'utilisation',
    footer_l_privacy: 'Confidentialité',
    footer_l_security: 'Sécurité',
    footer_l_rgpd: 'RGPD',
    footer_l_cookies: 'Cookies',
  },

  en: {
    nav_features: 'Features',
    nav_agents: 'AI Agents',
    nav_pricing: 'Pricing',
    nav_usecases: 'Use cases',
    nav_faq: 'FAQ',
    nav_login: 'Sign in',
    nav_cta: 'Get started',

    hero_badge: 'Powered by 13 specialized AI agents',
    hero_title_1: 'Your business\'s digital empire,',
    hero_title_2: 'managed by AI.',
    hero_subtitle: 'AfriLaunch AI centralizes branding, website, content, social media and Mobile Money payments. 13 AI agents work 24/7 while you scale.',
    hero_cta_primary: 'Start now',
    hero_cta_secondary: 'See demo',
    hero_note: 'Mobile Money payment · Activation in 24h · No commitment',

    stats_users: 'Active entrepreneurs',
    stats_countries: 'African countries',
    stats_agents: 'AI agents',
    stats_uptime: 'Uptime guarantee',

    press_title: 'Featured in',

    demo_badge: 'Product preview',
    demo_title: 'One dashboard. Your entire business.',
    demo_subtitle: 'Pilot your 13 AI agents, your content, your socials and your payments from one interface — built for African realities.',

    agents_badge: '13 AI agents',
    agents_title: 'A team of experts, available 24/7.',
    agents_subtitle: 'Each agent is a business expert trained on African market realities. They remember your business and work in context.',

    features_badge: 'Features',
    features_title: 'Everything your business needs.',
    features_subtitle: 'A unified platform that replaces 10 tools. From branding to payments, through content and social media.',
    features: [
      { title: 'AI brand identity', desc: 'Logos, palettes and brand guidelines generated in 30 seconds by our creative AI.' },
      { title: 'Instant website', desc: 'A modern, responsive and SEO-optimized website, ready to publish in 1 click.' },
      { title: 'Content studio', desc: 'Posts, video scripts, newsletters and flyers created automatically by AI.' },
      { title: 'Unified social media', desc: 'Connect Instagram, TikTok, Facebook, WhatsApp, LinkedIn and X in one place.' },
      { title: 'Mobile Money payments', desc: 'Accept MTN MoMo, Orange Money, Wave and bank transfer. Cash-out in 24h.' },
      { title: 'WhatsApp AI Agent', desc: 'An AI assistant that answers your customers 24/7 on WhatsApp, in 5 languages.' },
      { title: 'Predictive analytics', desc: 'Anticipate your sales and trends with predictive AI and local benchmarks.' },
      { title: 'Marketing campaigns', desc: 'Launch Google, Meta and TikTok campaigns optimized automatically by AI.' },
    ],

    usecases_badge: 'Use cases',
    usecases_title: 'Built for every African business.',
    usecases_subtitle: 'Whether you\'re a restaurant owner in Douala, an e-commerce seller in Lagos or a freelancer in Dakar — AfriLaunch AI adapts to your reality.',
    usecases: [
      { sector: 'Restaurant', title: 'Fill your tables, every night.', desc: 'Website with online menu, WhatsApp reservations, daily Instagram posts and geolocated Meta Ads campaigns.', metric: '+47% reservations' },
      { sector: 'E-commerce', title: 'Sell more, with less effort.', desc: 'Online store, SEO-optimized product pages, Mobile Money payments and automatic customer replies.', metric: '+320% sales' },
      { sector: 'Freelance', title: '10x your productivity.', desc: 'Proposals, contracts, invoices, client content — AI handles admin while you bill.', metric: '15h saved/week' },
      { sector: 'Startup', title: 'Launch faster, scale further.', desc: 'Brand identity, landing page, growth strategy and investors — your complete stack from zero to scale.', metric: 'MVP in 7 days' },
    ],

    compare_badge: 'Comparison',
    compare_title: 'Why choose AfriLaunch AI?',
    compare_subtitle: 'One platform vs 4 separate subscriptions. Built for Africa, designed for ROI.',
    compare_col_us: 'AfriLaunch AI',
    compare_col_chatgpt: 'ChatGPT',
    compare_col_canva: 'Canva',
    compare_col_buffer: 'Buffer',
    compare_features: [
      { label: '13 specialized AI agents', us: true, chatgpt: '1 generic chat', canva: false, buffer: false },
      { label: 'Business memory (context)', us: true, chatgpt: false, canva: false, buffer: false },
      { label: 'Full website generation', us: true, chatgpt: 'Partial', canva: false, buffer: false },
      { label: 'Multi-platform publishing', us: true, chatgpt: false, canva: 'Partial', buffer: true },
      { label: 'Mobile Money payments (FCFA)', us: true, chatgpt: false, canva: false, buffer: false },
      { label: 'WhatsApp AI Agent', us: true, chatgpt: false, canva: false, buffer: false },
      { label: 'Adapted to African market', us: true, chatgpt: false, canva: false, buffer: false },
      { label: 'Pricing in FCFA', us: '5,000 FCFA', chatgpt: '$20 USD', canva: '$15 USD', buffer: '$12 USD' },
    ],

    pricing_badge: 'Pricing',
    pricing_title: 'Prices designed for Africa.',
    pricing_subtitle: 'In FCFA. Mobile Money or bank transfer payment. Activation in 24h. No credit card required.',
    pricing_month: '/month',
    pricing_popular: 'Most popular',
    pricing_plans: [
      { name: 'Starter', price: '5,000', desc: 'To get started', features: ['13 AI agents', 'Basic website', '2 social networks', '500 AI credits/month', 'Email support 48h'], cta: 'Start' },
      { name: 'Pro', price: '15,000', desc: 'To grow', popular: true, features: ['13 AI agents', 'Premium website + domain', '5 social networks', '5,000 AI credits/month', 'WhatsApp AI Agent', 'Advanced analytics', 'Priority support 24h'], cta: 'Choose Pro' },
      { name: 'Business', price: '40,000', desc: 'To scale', features: ['13 AI agents', 'E-commerce website + publishing', '6 social networks', '50,000 AI credits/month', 'Multi-user (20)', 'Full API access', 'Dedicated account manager'], cta: 'Choose Business' },
      { name: 'Enterprise', price: '150,000', desc: 'Custom', features: ['Unlimited agents', 'Dedicated infrastructure', 'Unlimited credits', '99.99% SLA', 'Custom integrations', 'SSO & advanced security', 'Dedicated 24/7 support'], cta: 'Contact us' },
    ],
    pricing_note: 'All prices in FCFA (XOF). Mobile Money (MTN, Orange, Wave) or bank transfer payment.',

    proof_badge: 'Testimonials',
    proof_title: 'They scale with AfriLaunch AI.',
    proof_subtitle: 'African entrepreneurs who transformed their business with AI.',
    proof_testimonials: [
      { initials: 'AK', name: 'Aïcha Kone', country: 'Côte d\'Ivoire', quote: 'In 2 weeks, I launched my online store with logo, website and Mobile Money payments. Incredible.', metric: '+320% sales' },
      { initials: 'MO', name: 'Marcus Okafor', country: 'Nigeria', quote: 'AI agents handle my SEO and Ads campaigns. My ROAS went from 1.8 to 4.2 in one month.', metric: 'ROAS 4.2x' },
      { initials: 'ND', name: 'Nadia Diallo', country: 'Senegal', quote: 'The WhatsApp Agent answers my customers day and night. I sleep, my business keeps running.', metric: '24/7 support' },
      { initials: 'BM', name: 'Boubacar Mbaye', country: 'Mali', quote: 'The Content Agent produces my Instagram posts in 10 seconds. I save 15 hours per week.', metric: '15h/week' },
    ],

    faq_badge: 'FAQ',
    faq_title: 'Frequently asked questions.',
    faq_subtitle: 'Everything you need to know before getting started.',
    faq_items: [
      { q: 'How does payment work?', a: 'You pay in FCFA via Mobile Money (MTN MoMo, Orange Money, Wave) or bank transfer. Upload your payment proof, our team activates your account within 24h.' },
      { q: 'Is there a free trial?', a: 'No — AfriLaunch AI is a premium service. You must subscribe to use the platform. The Starter plan at 5,000 FCFA/month is the most accessible entry point.' },
      { q: 'Does the AI understand African context?', a: 'Yes. Our 13 AI agents are trained on African market realities: buying habits (Mobile Money, cash on delivery), local languages (Wolof, Swahili, Yoruba), cultural references and benchmarks by country.' },
      { q: 'Is my data secure?', a: 'Your data is stored on Supabase (PostgreSQL) with encryption and RLS (Row-Level Security). Your conversations with AI agents are private and never shared. GDPR compliant.' },
      { q: 'Can I change plans or cancel?', a: 'Yes, anytime from your dashboard. You can upgrade, downgrade or cancel in 1 click. Credits already paid remain available until the end of the current period.' },
      { q: 'Which social networks are supported?', a: 'Instagram, TikTok, Facebook, WhatsApp Business, LinkedIn and X (Twitter). You connect your accounts in 1 click, then publish or schedule from the Content module.' },
      { q: 'Does the app work offline?', a: 'The app requires an internet connection. However, it\'s a PWA (Progressive Web App) — you can install it on your phone and access it like a native app. Generated websites are hosted online and available 24/7.' },
      { q: 'What support is available?', a: 'Starter: email (48h response). Pro: priority email (24h) + chat. Business: dedicated account manager + Slack. Enterprise: dedicated 24/7 support + 99.99% SLA.' },
    ],

    cta_title: 'Ready to scale your business?',
    cta_subtitle: 'Join African entrepreneurs using AI to save time, sell more and grow faster.',
    cta_button: 'Create my account',
    cta_note: 'Activation in 24h · Mobile Money payment · No commitment',

    footer_tagline: 'Your business\'s digital empire, managed by AI.',
    footer_slogan: 'LAUNCH. MANAGE. SCALE.',
    footer_product: 'Product',
    footer_modules: 'Modules',
    footer_resources: 'Resources',
    footer_company: 'Company',
    footer_legal: 'Legal',
    footer_newsletter_title: 'Stay ahead in African entrepreneurship',
    footer_newsletter_desc: 'Get our guides, case studies and product news. 1 email per week, never any spam.',
    footer_newsletter_placeholder: 'your@email.com',
    footer_newsletter_button: 'Subscribe',
    footer_newsletter_consent: 'By subscribing, you agree to our privacy policy.',
    footer_newsletter_success: 'Thank you! Check your inbox to confirm.',
    footer_contact: 'Contact',
    footer_follow_us: 'Follow us',
    footer_payments: 'Accepted payments',
    footer_rights: 'All rights reserved.',
    footer_made_in: 'Crafted with ❤️ in Africa',
    footer_back_to_top: 'Back to top',
    footer_lang: 'Language',
    footer_status: 'System status',
    footer_status_ok: 'Operational',

    footer_l_features: 'Features',
    footer_l_agents: 'AI Agents',
    footer_l_pricing: 'Pricing',
    footer_l_usecases: 'Use cases',
    footer_l_faq: 'FAQ',
    footer_l_demo: 'Live demo',

    footer_l_identity: 'Brand identity',
    footer_l_brand_kit: 'Brand Kit',
    footer_l_website: 'Website',
    footer_l_content: 'Content',
    footer_l_social: 'Social media',
    footer_l_whatsapp: 'WhatsApp Agent',
    footer_l_voice: 'AI Voice',
    footer_l_analytics: 'Analytics',
    footer_l_payments: 'Payments',
    footer_l_my_agents: 'My agents',
    footer_l_marketplace: 'Marketplace',

    footer_l_blog: 'Blog',
    footer_l_docs: 'Documentation',
    footer_l_api: 'API Docs',
    footer_l_help: 'Help center',
    footer_l_community: 'Community',
    footer_l_changelog: 'Changelog',
    footer_l_status: 'System status',
    footer_l_webinars: 'Webinars',

    footer_l_about: 'About',
    footer_l_careers: 'Careers',
    footer_l_partners: 'Partners',
    footer_l_press: 'Press',
    footer_l_contact: 'Contact us',

    footer_l_terms: 'Terms of service',
    footer_l_privacy: 'Privacy policy',
    footer_l_security: 'Security',
    footer_l_rgpd: 'GDPR',
    footer_l_cookies: 'Cookies',
  },
};
