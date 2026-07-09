// AfriLaunch AI — Landing Page
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import {
  Rocket, Sparkles, Globe, Zap, ArrowRight, Star, Check,
  Play, Shield, Users, BarChart3, Palette,
} from 'lucide-react';
import { PricingSection } from '@/components/marketing/pricing';
import { TestimonialsSection } from '@/components/marketing/testimonials';
import { FeaturesSection } from '@/components/marketing/features';
import { AgentsSection } from '@/components/marketing/agents';

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const stats = [
    { value: '50K+', label: 'Entrepreneurs actifs' },
    { value: '54', label: 'Pays africains' },
    { value: '13', label: 'Agents IA spécialisés' },
    { value: '99.9%', label: 'Uptime garanti' },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-hidden">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between
                      px-6 py-4 glass border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600
                          flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">AfriLaunch <span className="gradient-text">AI</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          {['Fonctionnalités', 'Agents IA', 'Tarifs', 'Blog'].map(item => (
            <Link key={item} href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="hover:text-white transition-colors">
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">
            Connexion
          </Link>
          <Link href="/register"
            className="text-sm font-semibold px-5 py-2.5 rounded-xl
                       bg-gradient-to-r from-indigo-500 to-violet-600
                       hover:from-indigo-400 hover:to-violet-500
                       transition-all duration-300 hover:scale-105">
            Commencer gratuitement
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center
                                        px-6 pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-[800px] h-[600px] rounded-full
                          bg-gradient-to-r from-indigo-500/20 to-violet-500/20
                          blur-3xl animate-aurora" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full
                          bg-cyan-500/10 blur-3xl animate-aurora delay-300" />
          <div className="dot-pattern absolute inset-0 opacity-30" />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                       glass border border-indigo-500/30 mb-8"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-300 font-medium">
              La plateforme N°1 pour entrepreneurs africains
            </span>
            <span className="badge-new">NOUVEAU</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6"
          >
            Lancez votre{' '}
            <span className="gradient-text">empire digital</span>
            <br />
            en{' '}
            <span className="gradient-text-africa">Afrique</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Logo, site web, réseaux sociaux, contenu, paiements et agents IA spécialisés.
            Tout ce dont vous avez besoin pour dominer le digital africain —{' '}
            <strong className="text-white">en minutes, pas en mois.</strong>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href="/register"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-lg
                         bg-gradient-to-r from-indigo-500 to-violet-600 text-white
                         hover:from-indigo-400 hover:to-violet-500 shadow-xl shadow-indigo-500/25
                         hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105">
              Démarrer gratuitement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              className="group flex items-center gap-3 px-6 py-4 rounded-2xl font-medium
                         glass border border-white/10 hover:bg-white/10 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Play className="w-4 h-4 text-white ml-0.5" />
              </div>
              Voir la démo (2 min)
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features Section ── */}
      <FeaturesSection />

      {/* ── Agents IA Section ── */}
      <AgentsSection />

      {/* ── Testimonials ── */}
      <TestimonialsSection />

      {/* ── Pricing ── */}
      <PricingSection />

      {/* ── CTA Final ── */}
      <section className="py-32 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="relative glass rounded-3xl p-16 overflow-hidden border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10" />
            <div className="relative z-10">
              <div className="text-5xl mb-6">🚀</div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Prêt à{' '}
                <span className="gradient-text">dominer le digital ?</span>
              </h2>
              <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto">
                Rejoignez 50 000+ entrepreneurs africains qui ont déjà lancé leur présence
                numérique avec AfriLaunch AI. Essai gratuit, sans carte bancaire.
              </p>
              <Link href="/register"
                className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl font-bold text-xl
                           bg-gradient-to-r from-indigo-500 to-violet-600 text-white
                           hover:from-indigo-400 hover:to-violet-500 shadow-2xl shadow-indigo-500/30
                           hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105">
                Commencer maintenant — Gratuit
                <ArrowRight className="w-6 h-6" />
              </Link>
              <p className="text-gray-600 text-sm mt-6">
                ✓ Aucune carte bancaire requise ✓ Annulation à tout moment ✓ Support 24/7
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600
                              flex items-center justify-center">
                <Rocket className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold">AfriLaunch AI</span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              © 2025 AfriLaunch AI. Construit avec ❤️ pour l'Afrique.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              {['Confidentialité', 'Conditions', 'Contact'].map(link => (
                <Link key={link} href={`/${link.toLowerCase()}`}
                  className="hover:text-white transition-colors">
                  {link}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
