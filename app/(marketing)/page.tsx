// AfriLaunch AI — Landing Page Premium
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Play,
  Sparkles,
  Palette,
  Globe,
  PenSquare,
  Share2,
  Bot,
  CreditCard,
  BarChart3,
  Megaphone,
  MessageCircle,
  Star,
  TrendingUp,
  Search,
  Headphones,
  FileText,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Check,
  ShieldCheck,
  Zap,
  Lock,
} from 'lucide-react';

/* ─── Données ───────────────────────────────────────────────── */

const stats = [
  { value: '50K+', label: 'Entrepreneurs actifs' },
  { value: '54', label: 'Pays africains' },
  { value: '13', label: 'Agents IA spécialisés' },
  { value: '99.9%', label: 'Uptime garanti' },
];

const pressLogos = ['TechCabal', 'Jeune Afrique', 'Rest of World', 'Bloomberg Africa', 'RFI'];

const features = [
  { icon: Palette,      title: 'Identité de marque IA',  desc: 'Logos, palettes et charte graphique générés en secondes par notre IA créative.', color: 'from-violet-500 to-fuchsia-500', glow: 'shadow-violet-500/20' },
  { icon: Globe,        title: 'Site web instantané',     desc: 'Un site moderne, responsive et optimisé SEO, prêt à publier en un clic.',         color: 'from-blue-500 to-cyan-500',     glow: 'shadow-blue-500/20' },
  { icon: PenSquare,    title: 'Studio de contenu',       desc: 'Articles, posts et scripts vidéo créés automatiquement par notre IA éditoriale.', color: 'from-pink-500 to-rose-500',     glow: 'shadow-pink-500/20' },
  { icon: Share2,       title: 'Réseaux sociaux',         desc: 'Programmez et publiez sur Instagram, TikTok, LinkedIn et Facebook en un seul lieu.', color: 'from-green-500 to-emerald-500', glow: 'shadow-green-500/20' },
  { icon: Bot,          title: '13 Agents IA',            desc: 'Une équipe d\'agents spécialisés pour chaque tâche de votre business.',             color: 'from-indigo-500 to-violet-500', glow: 'shadow-indigo-500/20' },
  { icon: CreditCard,   title: 'Paiements Mobile Money',  desc: 'Acceptez Orange Money, MTN MoMo, Wave et cartes. Cash-out en 24h.',                color: 'from-teal-500 to-cyan-500',     glow: 'shadow-teal-500/20' },
  { icon: BarChart3,    title: 'Analytics prédictifs',    desc: 'Anticipez vos ventes et vos tendances grâce à l\'IA prédictive.',                  color: 'from-sky-500 to-blue-500',      glow: 'shadow-sky-500/20' },
  { icon: Megaphone,    title: 'Campagnes marketing',     desc: 'Lancez des campagnes Google, Meta et TikTok optimisées automatiquement.',          color: 'from-orange-500 to-amber-500',  glow: 'shadow-orange-500/20' },
  { icon: MessageCircle,title: 'WhatsApp Agent IA',       desc: 'Un assistant IA qui répond à vos clients 24/7 sur WhatsApp dans 5 langues.',       color: 'from-green-500 to-lime-500',    glow: 'shadow-green-500/20' },
];

const agents = [
  { icon: Palette,     name: 'Agent Branding',  role: 'Logo, identité visuelle, charte', color: 'from-violet-500 to-fuchsia-500' },
  { icon: FileText,    name: 'Agent Content',   role: 'Articles, posts, scripts vidéo',  color: 'from-pink-500 to-rose-500' },
  { icon: Search,      name: 'Agent SEO',       role: 'Optimisation, mots-clés, backlinks', color: 'from-blue-500 to-cyan-500' },
  { icon: Megaphone,   name: 'Agent Ads',       role: 'Campagnes Google, Meta, TikTok',  color: 'from-orange-500 to-amber-500' },
  { icon: Headphones,  name: 'Agent Support',   role: 'Support client multilingue 24/7', color: 'from-emerald-500 to-teal-500' },
  { icon: TrendingUp,  name: 'Agent Growth',    role: 'Acquisition, rétention, analytics', color: 'from-indigo-500 to-violet-500' },
];

const steps = [
  { num: '1', title: 'Créez votre compte',     desc: 'Inscrivez-vous gratuitement en 30 secondes. Aucune carte bancaire requise.', icon: Zap },
  { num: '2', title: 'Configurez votre orga',  desc: 'Décrivez votre business. L\'IA génère logo, site et stratégie instantanément.', icon: Sparkles },
  { num: '3', title: 'L\'IA fait le reste',    desc: 'Vos agents travaillent 24/7. Vous pilotez, ils exécutent. Vous scalez.', icon: Bot },
];

const testimonials = [
  { initials: 'AK', name: 'Aïcha Kone',   country: 'Côte d\'Ivoire', quote: 'En 2 semaines, j\'ai lancé ma boutique en ligne avec logo, site et paiements Mobile Money. Incroyable.', rating: 5, metric: '+320% de ventes' },
  { initials: 'MO', name: 'Marcus Okafor', country: 'Nigeria',        quote: 'Les agents IA gèrent mon SEO et mes campagnes Ads. Mon ROAS est passé de 1.8 à 4.2 en un mois.',         rating: 5, metric: 'ROAS 4.2x' },
  { initials: 'ND', name: 'Nadia Diallo',  country: 'Sénégal',        quote: 'Le WhatsApp Agent répond à mes clients jour et nuit. Je dors, mon business continue de tourner.',       rating: 5, metric: '24/7 support' },
];

const pricing = [
  { name: 'Starter',    price: '5 000',     period: '/mois', desc: 'Pour démarrer',     popular: false, features: ['1 agent IA', 'Site web basique', '2 réseaux sociaux', '500 crédits IA/mois', 'Support email'], cta: 'Commencer' },
  { name: 'Pro',        price: '15 000',    period: '/mois', desc: 'Le plus populaire', popular: true,  features: ['5 agents IA', 'Site web premium', '5 réseaux sociaux', '5 000 crédits IA/mois', 'WhatsApp Agent', 'Analytics avancés', 'Support prioritaire'], cta: 'Démarrer l\'essai' },
  { name: 'Business',   price: '40 000',    period: '/mois', desc: 'Pour scale',        popular: false, features: ['13 agents IA', 'Site e-commerce', 'Réseaux illimités', '20 000 crédits IA/mois', 'Multi-utilisateurs', 'API complète', 'Account manager'], cta: 'Choisir Business' },
  { name: 'Enterprise', price: '150 000',   period: '/mois', desc: 'Sur-mesure',        popular: false, features: ['Agents illimités', 'Infrastructure dédiée', 'Crédits illimités', 'SLA 99.99%', 'Intégrations sur-mesure', 'SSO & sécurité avancée', 'Support 24/7 dédié'], cta: 'Nous contacter' },
];

const socialIcons = [Twitter, Linkedin, Instagram, Facebook];
const trustBadges = [ShieldCheck, Zap, Lock];

/* ─── Composants utilitaires ────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] as const } }),
};

/* ─── Page ──────────────────────────────────────────────────── */

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-hidden">

      {/* ═══════════════ Navigation ═══════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/logo.svg" alt="AfriLaunch AI" className="w-8 h-8 transition-transform group-hover:scale-110" />
            <span className="font-bold text-lg">AfriLaunch <span className="gradient-text">AI</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm text-gray-400">
            {[
              { label: 'Fonctionnalités', href: '#fonctionnalites' },
              { label: 'Agents IA', href: '#agents-ia' },
              { label: 'Tarifs', href: '#tarifs' },
              { label: 'Blog', href: '#blog' },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="hover:text-white transition-colors">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Connexion
            </Link>
            <Link href="/register"
              className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600
                         hover:from-indigo-400 hover:to-violet-500 transition-all duration-300 hover:scale-105
                         shadow-lg shadow-indigo-500/25">
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════ Hero ═══════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full
                          bg-gradient-to-r from-indigo-500/25 to-violet-500/25 blur-3xl animate-aurora" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full
                          bg-cyan-500/15 blur-3xl animate-aurora delay-300" />
          <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full
                          bg-fuchsia-500/10 blur-3xl animate-aurora delay-500" />
          <div className="dot-pattern absolute inset-0 opacity-20" />
        </div>

        {/* Rocket flottant */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="absolute top-32 right-[12%] text-6xl animate-float hidden lg:block z-10"
          aria-hidden="true"
        >
          🚀
        </motion.div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/30 mb-8">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-200 font-medium">N°1 en Afrique</span>
            <span className="badge-new">NOUVEAU</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6 tracking-tight">
            Lancez votre <span className="gradient-text">empire digital</span><br />
            en <span className="gradient-text-africa">Afrique</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
            className="text-lg md:text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Logo, site web, réseaux sociaux, contenu, paiements Mobile Money et 13 agents IA spécialisés.
            Tout ce dont vous avez besoin pour dominer le digital africain —{' '}
            <strong className="text-white">en minutes, pas en mois.</strong>
          </motion.p>

          {/* CTAs */}
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-lg
                         bg-gradient-to-r from-indigo-500 to-violet-600 text-white
                         hover:from-indigo-400 hover:to-violet-500 shadow-xl shadow-indigo-500/25
                         hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105">
              Démarrer gratuitement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/dashboard"
              className="group flex items-center gap-3 px-6 py-4 rounded-2xl font-medium glass border border-white/10
                         hover:bg-white/10 transition-all">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Play className="w-4 h-4 text-white ml-0.5" aria-hidden="true" />
              </div>
              Voir la démo
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs md:text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ Trust Bar ═══════════════ */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-widest">Ils nous font confiance</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {pressLogos.map((name) => (
              <span key={name} className="text-lg md:text-xl font-semibold text-gray-600 hover:text-gray-300
                                          transition-colors cursor-default">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ Features ═══════════════ */}
      <section id="fonctionnalites" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full glass border border-white/10 text-sm text-indigo-300 mb-4">
              Fonctionnalités
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Tout-en-un, <span className="gradient-text">propulsé par l'IA</span></h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Ne payez plus 10 abonnements différents. AfriLaunch AI réunit tout ce dont votre business a besoin.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
                whileHover={{ scale: 1.03, y: -4 }}
                className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20
                           transition-all duration-300 hover:shadow-2xl cursor-pointer">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg ${f.glow}`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ Agents IA ═══════════════ */}
      <section id="agents-ia" className="py-28 px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full
                          bg-indigo-500/10 blur-3xl animate-aurora" />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full glass border border-white/10 text-sm text-violet-300 mb-4">
              Agents IA
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">13 agents IA</span> spécialisés
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Une équipe d'experts IA qui travaillent 24/7 pour votre business.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((a, i) => (
              <motion.div key={a.name}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20
                           transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shadow-lg`}>
                    <a.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-400 font-medium">En ligne</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-1">{a.name}</h3>
                <p className="text-sm text-gray-400">{a.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ How it works ═══════════════ */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full glass border border-white/10 text-sm text-cyan-300 mb-4">
              Comment ça marche
            </span>
            <h2 className="text-4xl md:text-5xl font-bold">Lancez-vous en <span className="gradient-text">3 étapes</span></h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Ligne de connexion */}
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            {steps.map((s, i) => (
              <motion.div key={s.num}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center relative">
                <div className="relative inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600
                                items-center justify-center mb-6 shadow-xl shadow-indigo-500/30 mx-auto">
                  <s.icon className="w-7 h-7 text-white" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-indigo-600
                                   text-xs font-bold flex items-center justify-center">{s.num}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ Testimonials ═══════════════ */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full glass border border-white/10 text-sm text-pink-300 mb-4">
              Témoignages
            </span>
            <h2 className="text-4xl md:text-5xl font-bold">Ils ont <span className="gradient-text-africa">scalingé</span> avec nous</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20
                           transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600
                                    flex items-center justify-center text-sm font-bold">
                      {t.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.country}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                    {t.metric}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ Pricing ═══════════════ */}
      <section id="tarifs" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full glass border border-white/10 text-sm text-indigo-300 mb-4">
              Tarifs
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Des prix <span className="gradient-text">pensés pour l'Afrique</span></h2>
            <p className="text-gray-400 text-lg">En FCFA. Annulation à tout moment. Sans engagement.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {pricing.map((p, i) => (
              <motion.div key={p.name}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -8 }}
                className={`relative glass rounded-2xl p-6 border transition-all duration-300 hover:shadow-2xl
                  ${p.popular ? 'border-indigo-500/50 shadow-xl shadow-indigo-500/20 md:scale-105' : 'border-white/10 hover:border-white/20'}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full
                                  bg-gradient-to-r from-indigo-500 to-violet-600 text-xs font-bold whitespace-nowrap">
                    ⭐ Populaire
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-1">{p.name}</h3>
                <p className="text-xs text-gray-500 mb-4">{p.desc}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold">{p.price}</span>
                  <span className="text-sm text-gray-400">FCFA</span>
                  <span className="text-xs text-gray-500 ml-1">{p.period}</span>
                </div>
                <Link href="/register"
                  className={`block text-center mt-5 mb-6 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300
                    ${p.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/25 hover:scale-105'
                      : 'glass border border-white/15 hover:bg-white/10'}`}>
                  {p.cta}
                </Link>
                <ul className="space-y-2.5">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA Final ═══════════════ */}
      <section className="py-28 px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto">
          <div className="relative glass rounded-3xl p-12 md:p-16 overflow-hidden border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-fuchsia-500/15" />
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-violet-500/20 blur-3xl animate-aurora" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-indigo-500/20 blur-3xl animate-aurora delay-300" />
            <div className="relative z-10 text-center">
              <div className="text-5xl mb-6 animate-float inline-block">🚀</div>
              <h2 className="text-4xl md:text-5xl font-bold mb-5">
                Prêt à <span className="gradient-text">dominer le digital ?</span>
              </h2>
              <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
                Rejoignez 50 000+ entrepreneurs africains qui ont déjà lancé leur présence numérique avec AfriLaunch AI.
                Essai gratuit, sans carte bancaire.
              </p>
              <Link href="/register"
                className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl font-bold text-xl
                           bg-gradient-to-r from-indigo-500 to-violet-600 text-white
                           hover:from-indigo-400 hover:to-violet-500 shadow-2xl shadow-indigo-500/30
                           hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105">
                Commencer maintenant — Gratuit
                <ArrowRight className="w-6 h-6" />
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-400">
                {trustBadges.map((Icon, idx) => (
                  <span key={idx} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-green-400" />
                    {['Aucune carte requise', 'Annulation à tout moment', 'Support 24/7'][idx]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ Footer ═══════════════ */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="AfriLaunch AI" className="w-7 h-7" />
              <span className="font-bold">AfriLaunch AI</span>
            </div>

            <p className="text-gray-500 text-sm text-center">
              © {new Date().getFullYear()} AfriLaunch AI. Construit avec ❤️ pour l'Afrique.
            </p>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {['Confidentialité', 'Conditions', 'Contact'].map((link) => (
                  <Link key={link} href={`/${link.toLowerCase()}`} className="hover:text-white transition-colors">
                    {link}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {socialIcons.map((Icon, idx) => (
                  <a key={idx} href="#" aria-label="Réseau social"
                    className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center
                               hover:bg-white/10 hover:border-white/20 transition-all">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
