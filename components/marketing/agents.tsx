// AfriLaunch AI — AI Agents Section
'use client';

import { motion } from 'framer-motion';
import {
  Palette, PenSquare, Search, Megaphone, Headphones,
  BarChart3, ShoppingBag, Mail, Video, Globe,
  Code, FileText, TrendingUp,
} from 'lucide-react';

const agents = [
  { icon: Palette, name: 'Branding Agent', role: 'Identité de marque', color: 'from-violet-500 to-purple-600' },
  { icon: PenSquare, name: 'Content Agent', role: 'Création de contenu', color: 'from-pink-500 to-rose-600' },
  { icon: Search, name: 'SEO Agent', role: 'Optimisation référencement', color: 'from-emerald-500 to-green-600' },
  { icon: Megaphone, name: 'Ads Agent', role: 'Publicités & campaigns', color: 'from-orange-500 to-amber-600' },
  { icon: Headphones, name: 'Support Agent', role: 'Service client 24/7', color: 'from-cyan-500 to-blue-600' },
  { icon: BarChart3, name: 'Analytics Agent', role: 'Analyse prédictive', color: 'from-sky-500 to-indigo-600' },
  { icon: ShoppingBag, name: 'E-commerce Agent', role: 'Optimisation boutique', color: 'from-teal-500 to-emerald-600' },
  { icon: Mail, name: 'Email Agent', role: 'Newsletter & séquences', color: 'from-rose-500 to-pink-600' },
  { icon: Video, name: 'Video Agent', role: 'Scripts & montages', color: 'from-red-500 to-orange-600' },
  { icon: Globe, name: 'Localization Agent', role: 'Traduction & adaptation', color: 'from-indigo-500 to-violet-600' },
  { icon: Code, name: 'Dev Agent', role: 'Code & intégrations', color: 'from-slate-500 to-gray-600' },
  { icon: FileText, name: 'Legal Agent', role: 'Contrats & conformité', color: 'from-amber-500 to-yellow-600' },
  { icon: TrendingUp, name: 'Growth Agent', role: 'Stratégie de croissance', color: 'from-green-500 to-teal-600' },
];

export function AgentsSection() {
  return (
    <section id="agents-ia" className="py-32 px-6 relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-500/30 mb-6">
            <span className="badge-new">EXCLUSIF</span>
            <span className="text-sm text-violet-300">13 agents IA spécialisés</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Votre équipe <span className="gradient-text">IA</span>
            <br />travaille 24/7
          </h2>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto">
            Chaque agent est un expert métier formé sur les réalités du marché africain.
            Ils collaborent entre eux pour propulser votre business pendant que vous dormez.
          </p>
        </motion.div>

        {/* Agents grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.07, type: 'spring', stiffness: 250, damping: 18 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative glass rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all duration-300 overflow-hidden"
            >
              {/* Gradient orb background */}
              <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color}
                                flex items-center justify-center mb-4 shadow-lg
                                group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300`}>
                  <agent.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-sm mb-1">{agent.name}</h3>
                <p className="text-xs text-gray-500">{agent.role}</p>

                {/* Status indicator */}
                <div className="mt-4 flex items-center gap-1.5">
                  <div className="status-dot active" />
                  <span className="text-[10px] text-green-400 font-medium uppercase tracking-wide">En ligne</span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* "+ more" card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-5 border border-dashed border-white/10 flex items-center justify-center text-center"
          >
            <div>
              <div className="text-3xl font-bold gradient-text mb-1">+</div>
              <p className="text-xs text-gray-500">Agents personnalisés via API</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
