// AfriLaunch AI — Testimonials Section
'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    quote: 'J\'ai lancé ma boutique de mode à Dakar en 1 weekend. Logo, site, Instagram — tout était prêt. Aujourd\'hui je vends dans 8 pays africains.',
    name: 'Aïssatou Diallo',
    role: 'Fondatrice, Teranga Mode',
    location: 'Dakar, Sénégal',
    avatar: 'AD',
    gradient: 'from-pink-500 to-rose-600',
    metric: '+340% de ventes en 6 mois',
  },
  {
    quote: 'Le Content Agent poste pour moi sur 4 réseaux chaque jour. Mon engagement a triplé sans que je lève le petit doigt. Magique.',
    name: 'Kwame Mensah',
    role: 'CEO, Accra Tech Hub',
    location: 'Accra, Ghana',
    avatar: 'KM',
    gradient: 'from-blue-500 to-cyan-600',
    metric: '3× plus d\'engagement',
  },
  {
    quote: 'Avant AfriLaunch, je payais 5 abonnements différents. Maintenant, tout est centralisé et l\'IA me fait économiser 20h par semaine.',
    name: 'Fatou Bensouda',
    role: 'Agence digitale FB Marketing',
    location: 'Abidjan, Côte d\'Ivoire',
    avatar: 'FB',
    gradient: 'from-violet-500 to-purple-600',
    metric: '20h économisées / semaine',
  },
  {
    quote: 'Les paiements Mobile Money intégrés ont transformé mon business. Mes clients au Mali et au Burkina paient en 1 clic.',
    name: 'Ibrahim Touré',
    role: 'Fondateur, Sahel AgriTech',
    location: 'Bamako, Mali',
    avatar: 'IT',
    gradient: 'from-green-500 to-emerald-600',
    metric: '+1 200 transactions / mois',
  },
  {
    quote: 'Le Growth Agent a identifié un créneau que je n\'avais pas vu. En 3 mois, mon CA a doublé. L\'IA comprend vraiment le marché local.',
    name: 'Chiamaka Okafor',
    role: 'Co-fondatrice, Lagos FoodTech',
    location: 'Lagos, Nigeria',
    avatar: 'CO',
    gradient: 'from-orange-500 to-amber-600',
    metric: '×2 de CA en 3 mois',
  },
  {
    quote: 'En tant qu\'agence, on gère 30+ clients depuis un seul dashboard. Le mode white-label nous a permis de doubler notre marge.',
    name: 'Mehdi Benali',
    role: 'Directeur, Casablanca Digital',
    location: 'Casablanca, Maroc',
    avatar: 'MB',
    gradient: 'from-teal-500 to-cyan-600',
    metric: '30 clients gérés en simultané',
  },
];

export function TestimonialsSection() {
  return (
    <section id="témoignages" className="py-32 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ils ont <span className="gradient-text-africa">lancé</span> avec nous
          </h2>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Plus de 50 000 entrepreneurs africains propulsent leur business avec AfriLaunch AI.
          </p>
        </motion.div>

        {/* Masonry-ish grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1, type: 'spring', stiffness: 200, damping: 22 }}
              className="glass rounded-3xl p-7 border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col"
            >
              <Quote className="w-8 h-8 text-white/10 mb-4" />
              <p className="text-gray-200 leading-relaxed mb-6 flex-1">"{t.quote}"</p>

              {/* Metric */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5
                              bg-gradient-to-r ${t.gradient} text-white w-fit`}>
                <Star className="w-3 h-3 fill-white" />
                {t.metric}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.gradient}
                                flex items-center justify-center font-bold text-white text-sm`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                  <p className="text-xs text-gray-600">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logos / press strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 pt-12 border-t border-white/5"
        >
          <p className="text-center text-xs uppercase tracking-widest text-gray-600 mb-6">
            Vu dans
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-gray-500 font-bold text-lg">
            {['TechCabal', 'Jeune Afrique', 'Rest of World', 'Bloomberg Africa', 'RFI'].map((logo) => (
              <span key={logo} className="hover:text-gray-300 transition-colors">{logo}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
