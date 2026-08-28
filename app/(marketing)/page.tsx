// AfriLaunch AI — Landing Page Premium (bilingue FR/EN, 12 sections)
'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Play, Sparkles, Palette, Globe, PenSquare, Share2, Bot,
  CreditCard, BarChart3, Megaphone, MessageCircle, Star, TrendingUp,
  Search, Headphones, FileText, Video, Languages, Code, Scale, Mail,
  Twitter, Linkedin, Instagram, Facebook, Check, X, ChevronDown,
  ShieldCheck, Zap, Lock, Rocket, ShoppingCart, Briefcase, Building2,
  UtensilsCrossed, type LucideIcon,
} from 'lucide-react';
import { STRINGS, type Lang } from '@/lib/landing-i18n';

/* ─── Static data (icons + colors, language-agnostic) ──────────── */

const pressLogos = ['TechCabal', 'Jeune Afrique', 'Rest of World', 'Bloomberg Africa', 'RFI'];

const featuresIcons: Array<{ icon: LucideIcon; color: string; glow: string }> = [
  { icon: Palette, color: 'from-violet-500 to-fuchsia-500', glow: 'shadow-violet-500/20' },
  { icon: Globe, color: 'from-blue-500 to-cyan-500', glow: 'shadow-blue-500/20' },
  { icon: PenSquare, color: 'from-pink-500 to-rose-500', glow: 'shadow-pink-500/20' },
  { icon: Share2, color: 'from-green-500 to-emerald-500', glow: 'shadow-green-500/20' },
  { icon: CreditCard, color: 'from-teal-500 to-cyan-500', glow: 'shadow-teal-500/20' },
  { icon: MessageCircle, color: 'from-green-500 to-lime-500', glow: 'shadow-green-500/20' },
  { icon: BarChart3, color: 'from-sky-500 to-blue-500', glow: 'shadow-sky-500/20' },
  { icon: Megaphone, color: 'from-orange-500 to-amber-500', glow: 'shadow-orange-500/20' },
];

const agentsData: Array<{ icon: LucideIcon; color: string }> = [
  { icon: Palette, color: 'from-violet-500 to-fuchsia-500' },
  { icon: FileText, color: 'from-pink-500 to-rose-500' },
  { icon: Search, color: 'from-emerald-500 to-green-600' },
  { icon: Megaphone, color: 'from-orange-500 to-amber-600' },
  { icon: Headphones, color: 'from-cyan-500 to-blue-600' },
  { icon: BarChart3, color: 'from-sky-500 to-indigo-600' },
  { icon: ShoppingCart, color: 'from-teal-500 to-emerald-600' },
  { icon: Mail, color: 'from-rose-500 to-pink-600' },
  { icon: Video, color: 'from-red-500 to-orange-600' },
  { icon: Languages, color: 'from-indigo-500 to-violet-600' },
  { icon: Code, color: 'from-slate-500 to-gray-600' },
  { icon: Scale, color: 'from-amber-500 to-yellow-600' },
  { icon: TrendingUp, color: 'from-green-500 to-teal-600' },
];

const useCasesIcons: Array<{ icon: LucideIcon; color: string }> = [
  { icon: UtensilsCrossed, color: 'from-orange-500 to-red-500' },
  { icon: ShoppingCart, color: 'from-blue-500 to-cyan-500' },
  { icon: Briefcase, color: 'from-violet-500 to-purple-500' },
  { icon: Rocket, color: 'from-emerald-500 to-teal-500' },
];

const statsData = [
  { key: 'stats_users', value: '50K+' },
  { key: 'stats_countries', value: '54' },
  { key: 'stats_agents', value: '13' },
  { key: 'stats_uptime', value: '99.9%' },
] as const;

/* ─── Animation variants ────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

/* ─── Page ──────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('fr');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const t = STRINGS[lang];

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Persist language in localStorage
  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem('afrilaunch.lang')) as Lang | null;
    if (saved === 'fr' || saved === 'en') setLang(saved);
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('afrilaunch.lang', lang);
  }, [lang]);

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">

      {/* ═══════════════ Navigation ═══════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="AfriLaunch AI" className="w-8 h-8 transition-transform group-hover:scale-110" />
            <span className="font-bold text-lg">AfriLaunch <span className="gradient-text">AI</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors">{t.nav_features}</Link>
            <Link href="#agents" className="hover:text-white transition-colors">{t.nav_agents}</Link>
            <Link href="#usecases" className="hover:text-white transition-colors">{t.nav_usecases}</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">{t.nav_pricing}</Link>
            <Link href="#faq" className="hover:text-white transition-colors">{t.nav_faq}</Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className="flex items-center gap-1 glass rounded-lg p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLang('fr')}
                className={`px-2 py-1 rounded-md transition-colors ${lang === 'fr' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >FR</button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-md transition-colors ${lang === 'en' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >EN</button>
            </div>
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">{t.nav_login}</Link>
            <Link href="/register"
              className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 transition-all duration-300 hover:scale-105 shadow-lg shadow-indigo-500/25">
              {t.nav_cta}
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════ 1. Hero ═══════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-24 pb-12 mesh-bg">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-500/20 blur-3xl animate-aurora" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-3xl animate-aurora delay-300" />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-indigo-500/30 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-indigo-300">{t.hero_badge}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]"
          >
            {t.hero_title_1}<br />
            <span className="gradient-text">{t.hero_title_2}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t.hero_subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <Link href="/register"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 transition-all duration-300 hover:scale-105 shadow-xl shadow-indigo-500/30 font-semibold">
              {t.hero_cta_primary}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <button type="button"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl glass border border-white/10 hover:bg-white/10 transition-all duration-300 font-semibold">
              <Play className="w-4 h-4 text-indigo-400" aria-hidden="true" />
              {t.hero_cta_secondary}
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xs text-gray-500"
          >
            {t.hero_note}
          </motion.p>
        </div>
      </section>

      {/* ═══════════════ 2. Stats strip ═══════════════ */}
      <section className="relative py-16 border-y border-white/5 glass">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {statsData.map((s, i) => (
            <motion.div key={s.key} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center">
              <p className="text-4xl md:text-5xl font-bold gradient-text mb-2">{s.value}</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest">{(t as any)[s.key]}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ 3. Press logos ═══════════════ */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-6">{t.press_title}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {pressLogos.map((logo) => (
              <span key={logo} className="text-lg font-bold text-gray-600 hover:text-gray-400 transition-colors cursor-default">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4. Product demo (mockup dashboard) ═══════════════ */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-300 mb-4">{t.demo_badge}</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.demo_title}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t.demo_subtitle}</p>
          </motion.div>

          {/* Mockup browser frame */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-indigo-500/10"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-4 px-3 py-1 rounded-md bg-white/5 text-xs text-gray-500 font-mono">afrilaunch.ai/dashboard</div>
            </div>
            <div className="grid grid-cols-12 gap-4 p-6 bg-[#050508]">
              {/* Sidebar */}
              <div className="col-span-3 space-y-2">
                {['Vue d\'ensemble', 'Identité', 'Site web', 'Contenu', 'Réseaux', 'Agents IA', 'Paiements'].map((item, i) => (
                  <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${i === 0 ? 'bg-indigo-500/20 text-white border border-indigo-500/30' : 'text-gray-500'}`}>
                    <div className={`w-3 h-3 rounded ${i === 0 ? 'bg-indigo-400' : 'bg-gray-700'}`} />
                    {item}
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div className="col-span-9 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[{ label: 'Crédits IA', value: '4 850', color: 'text-yellow-400' },
                    { label: 'Sites publiés', value: '3', color: 'text-emerald-400' },
                    { label: 'Messages agents', value: '127', color: 'text-violet-400' }].map((stat) => (
                    <div key={stat.label} className="glass rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase">{stat.label}</p>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="glass rounded-xl p-4 border border-white/5">
                  <p className="text-xs font-semibold mb-3 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-violet-400" aria-hidden="true" /> Agents IA actifs
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {agentsData.slice(0, 8).map((a, i) => (
                      <div key={i} className={`rounded-lg p-2 bg-gradient-to-br ${a.color} bg-opacity-20`}>
                        <a.icon className="w-4 h-4 text-white mb-1" aria-hidden="true" />
                        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white/60" style={{ width: `${60 + i * 5}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ 5. 13 Agents showcase ═══════════════ */}
      <section id="agents" className="py-24 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-semibold text-violet-300 mb-4">{t.agents_badge}</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.agents_title}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t.agents_subtitle}</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {agentsData.map((agent, i) => {
              const labels = lang === 'fr'
                ? ['Branding', 'Content', 'SEO', 'Ads', 'Support', 'Analytics', 'E-commerce', 'Email', 'Video', 'Localization', 'Dev', 'Legal', 'Growth']
                : ['Branding', 'Content', 'SEO', 'Ads', 'Support', 'Analytics', 'E-commerce', 'Email', 'Video', 'Localization', 'Dev', 'Legal', 'Growth'];
              const roles = lang === 'fr'
                ? ['Identité de marque', 'Création de contenu', 'Optimisation référencement', 'Publicités & campagnes', 'Service client 24/7', 'Analyse prédictive', 'Optimisation boutique', 'Newsletter & séquences', 'Scripts & montages', 'Traduction & adaptation', 'Code & intégrations', 'Contrats & conformité', 'Stratégie de croissance']
                : ['Brand identity', 'Content creation', 'SEO optimization', 'Ads & campaigns', '24/7 customer support', 'Predictive analytics', 'Store optimization', 'Newsletter & sequences', 'Scripts & editing', 'Translation & adaptation', 'Code & integrations', 'Contracts & compliance', 'Growth strategy'];
              return (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className="glass rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all group"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
                    <agent.icon className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <p className="font-bold text-sm mb-0.5">{labels[i]}</p>
                  <p className="text-xs text-gray-500">{roles[i]}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ 6. Features grid ═══════════════ */}
      <section id="features" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300 mb-4">{t.features_badge}</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.features_title}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t.features_subtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.features.map((f, i) => {
              const meta = featuresIcons[i];
              return (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className={`glass rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all group shadow-lg ${meta.glow}`}
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                    <meta.icon className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <p className="font-bold text-sm mb-2">{f.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ 7. Use cases ═══════════════ */}
      <section id="usecases" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-300 mb-4">{t.usecases_badge}</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.usecases_title}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t.usecases_subtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.usecases.map((uc, i) => {
              const meta = useCasesIcons[i];
              return (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="glass rounded-3xl p-7 border border-white/5 hover:border-white/15 transition-all group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <meta.icon className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{uc.sector}</p>
                      <h3 className="text-lg font-bold">{uc.title}</h3>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">{uc.metric}</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{uc.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ 8. Comparison table ═══════════════ */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs font-semibold text-orange-300 mb-4">{t.compare_badge}</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.compare_title}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t.compare_subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass rounded-2xl border border-white/10 overflow-hidden"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="text-left p-4 text-gray-500 font-semibold text-xs uppercase tracking-wider"></th>
                  <th className="p-4 text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold">{t.compare_col_us}</span>
                  </th>
                  <th className="p-4 text-center text-gray-400 font-semibold text-xs">{t.compare_col_chatgpt}</th>
                  <th className="p-4 text-center text-gray-400 font-semibold text-xs">{t.compare_col_canva}</th>
                  <th className="p-4 text-center text-gray-400 font-semibold text-xs">{t.compare_col_buffer}</th>
                </tr>
              </thead>
              <tbody>
                {t.compare_features.map((row, i) => (
                  <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="p-4 text-gray-300 text-xs">{row.label}</td>
                    <td className="p-4 text-center">
                      {typeof row.us === 'boolean' ? (
                        row.us ? <Check className="w-4 h-4 text-emerald-400 mx-auto" aria-hidden="true" /> : <X className="w-4 h-4 text-gray-600 mx-auto" aria-hidden="true" />
                      ) : (
                        <span className="text-xs font-bold text-white">{row.us}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.chatgpt === 'boolean' ? (
                        row.chatgpt ? <Check className="w-4 h-4 text-emerald-400 mx-auto" aria-hidden="true" /> : <X className="w-4 h-4 text-gray-600 mx-auto" aria-hidden="true" />
                      ) : (
                        <span className="text-xs text-gray-400">{row.chatgpt}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.canva === 'boolean' ? (
                        row.canva ? <Check className="w-4 h-4 text-emerald-400 mx-auto" aria-hidden="true" /> : <X className="w-4 h-4 text-gray-600 mx-auto" aria-hidden="true" />
                      ) : (
                        <span className="text-xs text-gray-400">{row.canva}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.buffer === 'boolean' ? (
                        row.buffer ? <Check className="w-4 h-4 text-emerald-400 mx-auto" aria-hidden="true" /> : <X className="w-4 h-4 text-gray-600 mx-auto" aria-hidden="true" />
                      ) : (
                        <span className="text-xs text-gray-400">{row.buffer}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ 9. Pricing ═══════════════ */}
      <section id="pricing" className="py-24 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-xs font-semibold text-teal-300 mb-4">{t.pricing_badge}</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.pricing_title}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t.pricing_subtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {t.pricing_plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className={`glass rounded-3xl p-6 border transition-all relative ${
                  plan.popular
                    ? 'border-indigo-500/50 shadow-2xl shadow-indigo-500/20 lg:scale-105'
                    : 'border-white/5 hover:border-white/15'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    {t.pricing_popular}
                  </span>
                )}
                <p className="text-sm font-bold text-gray-400 mb-1">{plan.name}</p>
                <p className="text-xs text-gray-600 mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-xs text-gray-500">FCFA {t.pricing_month}</span>
                </div>
                <ul className="space-y-2 my-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:scale-[1.02]'
                      : 'glass border border-white/10 hover:bg-white/10'
                  }`}>
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-8">{t.pricing_note}</p>
        </div>
      </section>

      {/* ═══════════════ 10. Social proof ═══════════════ */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-xs font-semibold text-pink-300 mb-4">{t.proof_badge}</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.proof_title}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t.proof_subtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {t.proof_testimonials.map((tm, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="glass rounded-2xl p-5 border border-white/5"
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mb-4 italic">"{tm.quote}"</p>
                <div className="flex items-center gap-2.5 pt-3 border-t border-white/5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold">{tm.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{tm.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{tm.country}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">{tm.metric}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 11. FAQ ═══════════════ */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-300 mb-4">{t.faq_badge}</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.faq_title}</h2>
            <p className="text-gray-400">{t.faq_subtitle}</p>
          </motion.div>

          <div className="space-y-3">
            {t.faq_items.map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="glass rounded-2xl border border-white/5 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm font-semibold pr-4">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs text-gray-400 leading-relaxed px-4 pb-4">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 12. Final CTA ═══════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-500/20 blur-3xl animate-aurora" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl mx-auto px-6 text-center"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">{t.cta_title}</h2>
          <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">{t.cta_subtitle}</p>
          <Link href="/register"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 transition-all duration-300 hover:scale-105 shadow-2xl shadow-indigo-500/30 font-semibold text-base">
            {t.cta_button}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <p className="text-xs text-gray-500 mt-6">{t.cta_note}</p>
        </motion.div>
      </section>

      {/* ═══════════════ Footer ═══════════════ */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="AfriLaunch AI" className="w-8 h-8" />
                <span className="font-bold">AfriLaunch <span className="gradient-text">AI</span></span>
              </Link>
              <p className="text-xs text-gray-500 leading-relaxed">{t.footer_tagline}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.footer_product}</p>
              <ul className="space-y-2 text-xs text-gray-500">
                <li><Link href="#features" className="hover:text-white transition-colors">{t.nav_features}</Link></li>
                <li><Link href="#agents" className="hover:text-white transition-colors">{t.nav_agents}</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">{t.nav_pricing}</Link></li>
                <li><Link href="#usecases" className="hover:text-white transition-colors">{t.nav_usecases}</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.footer_company}</p>
              <ul className="space-y-2 text-xs text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.footer_legal}</p>
              <ul className="space-y-2 text-xs text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">RGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
            <p className="text-xs text-gray-600">© {new Date().getFullYear()} AfriLaunch AI. {t.footer_rights}</p>
            <div className="flex items-center gap-3">
              {[Twitter, Linkedin, Instagram, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg glass border border-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
