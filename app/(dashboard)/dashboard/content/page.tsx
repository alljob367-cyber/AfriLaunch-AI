// AfriLaunch AI — Contenu module
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PenSquare, Sparkles, Wand2, RefreshCw, Copy, Pencil,
  FileText, Video, Image as ImageIcon, Mail,
  Instagram, Twitter, Calendar, Heart, type LucideIcon,
} from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface FormatOption {
  id: string;
  label: string;
  icon: LucideIcon;
  credits: number;
}

interface RecentContent {
  id: string;
  title: string;
  platform: 'Instagram' | 'TikTok' | 'Twitter' | 'Newsletter';
  status: 'Publié' | 'Programmé' | 'Brouillon';
  date: string;
}

const formats: FormatOption[] = [
  { id: 'post', label: 'Post Instagram', icon: Instagram, credits: 5 },
  { id: 'reel', label: 'Reel TikTok', icon: Video, credits: 8 },
  { id: 'story', label: 'Story', icon: ImageIcon, credits: 3 },
  { id: 'newsletter', label: 'Newsletter', icon: Mail, credits: 6 },
];

const recentContents: RecentContent[] = [
  { id: '1', title: 'Soldes d\'été — Collection 2024', platform: 'Instagram', status: 'Publié', date: '12 juin 2024' },
  { id: '2', title: 'Tutoriel : Nœuds de foulard panafricains', platform: 'TikTok', status: 'Publié', date: '10 juin 2024' },
  { id: '3', title: 'Annonce partenariat Sahel AgriTech', platform: 'Newsletter', status: 'Programmé', date: '15 juin 2024' },
  { id: '4', title: 'Coulisses shooting baobab', platform: 'Instagram', status: 'Brouillon', date: '08 juin 2024' },
  { id: '5', title: 'Thread : 5 astuces branding local', platform: 'Twitter', status: 'Programmé', date: '14 juin 2024' },
];

const stats: { label: string; value: string; icon: LucideIcon; tint: string }[] = [
  { label: 'Contenus créés', value: '247', icon: FileText, tint: 'text-pink-400' },
  { label: 'Cette semaine', value: '18', icon: Calendar, tint: 'text-rose-400' },
  { label: 'Programmés', value: '12', icon: Calendar, tint: 'text-amber-400' },
  { label: 'Taux engagement', value: '8,7 %', icon: Heart, tint: 'text-emerald-400' },
];

const platformIcon: Record<RecentContent['platform'], LucideIcon> = {
  Instagram,
  TikTok: Video,
  Twitter,
  Newsletter: Mail,
};

const statusStyles: Record<RecentContent['status'], string> = {
  Publié: 'bg-green-500/10 text-green-400',
  Programmé: 'bg-blue-500/10 text-blue-400',
  Brouillon: 'bg-gray-500/10 text-gray-400',
};

export default function ContentPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [activeFormat, setActiveFormat] = useState<string>('post');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Description manquante',
        description: 'Décrivez le contenu à générer avant de lancer l\'IA.',
        variant: 'warning',
      });
      return;
    }
    const selected = formats.find((f) => f.id === activeFormat);
    setGenerating(true);
    toast({
      title: 'Content Agent lancé',
      description: `Génération d'un ${selected?.label} en cours...`,
      variant: 'success',
    });
    await new Promise((r) => setTimeout(r, 2000));
    setGenerating(false);
    toast({
      title: 'Contenu généré !',
      description: `${selected?.label} prêt à éditer. ${selected?.credits} crédits débités.`,
      variant: 'success',
    });
    setPrompt('');
  };

  const handleEdit = (content: RecentContent) => {
    toast({
      title: 'Éditeur ouvert',
      description: `Modification de « ${content.title} »`,
      variant: 'success',
    });
  };

  const handleDuplicate = (content: RecentContent) => {
    toast({
      title: 'Contenu dupliqué',
      description: `Une copie de « ${content.title} » a été créée en brouillon.`,
      variant: 'success',
    });
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-pink-500/10 blur-3xl animate-aurora" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-rose-500/8 blur-3xl animate-aurora delay-300" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader
          title="Contenu"
          description="Créez posts, reels, flyers, scripts vidéo et newsletters. 50+ formats IA pour chaque réseau social africain."
          icon={PenSquare}
          gradient="from-pink-500 to-rose-600"
          action={
            <button
              type="button"
              onClick={() => toast({ title: 'Calendrier éditorial', description: 'Vue planning ouverte dans un nouvel onglet.', variant: 'success' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold glass hover:bg-white/10 transition-colors"
            >
              <Calendar className="w-4 h-4" aria-hidden="true" /> Calendrier
            </button>
          }
        />

        {/* Stats row */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          aria-label="Statistiques de contenu"
        >
          {stats.map((s) => (
            <div key={s.label} className="card-premium">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={cn('w-4 h-4', s.tint)} aria-hidden="true" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            </div>
          ))}
        </motion.section>

        {/* Quick generator */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium mb-10"
          aria-labelledby="generator-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <Wand2 className="w-5 h-5 text-pink-400" aria-hidden="true" />
            <h2 id="generator-title" className="text-xl font-bold">Générateur rapide</h2>
          </header>

          <label htmlFor="content-prompt" className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Décrivez votre contenu
          </label>
          <textarea
            id="content-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Ex : Annonce de notre nouvelle collection été inspirée des motifs wolof, ton chaleureux, appel à visiter la boutique en ligne."
            className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-pink-500/50 outline-none text-sm resize-y custom-scrollbar"
          />

          <fieldset className="mt-5">
            <legend className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Format</legend>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {formats.map((format) => {
                const isActive = activeFormat === format.id;
                return (
                  <li key={format.id}>
                    <button
                      type="button"
                      onClick={() => setActiveFormat(format.id)}
                      aria-pressed={isActive}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-all border',
                        isActive
                          ? 'border-pink-500/50 bg-pink-500/10 text-white'
                          : 'border-white/5 glass text-gray-400 hover:text-white hover:bg-white/10'
                      )}
                    >
                      <format.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      <span className="text-left flex-1">{format.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-pink-500 to-rose-600 hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-60 disabled:hover:scale-100"
          >
            {generating ? (
              <><RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> Génération en cours…</>
            ) : (
              <><Sparkles className="w-4 h-4" aria-hidden="true" /> Générer avec IA (5 crédits)</>
            )}
          </button>
        </motion.section>

        {/* Recent contents */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          aria-labelledby="recent-title"
        >
          <header className="flex items-center gap-2 mb-5">
            <FileText className="w-5 h-5 text-pink-400" aria-hidden="true" />
            <h2 id="recent-title" className="text-xl font-bold">Contenus récents</h2>
          </header>
          <ul className="space-y-3">
            {recentContents.map((content, i) => {
              const PlatformIcon = platformIcon[content.platform];
              return (
                <motion.li
                  key={content.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4 border border-white/5 hover:border-white/15 transition-all duration-300 flex items-center gap-4 flex-wrap"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-600/20 flex items-center justify-center flex-shrink-0">
                    <PlatformIcon className="w-5 h-5 text-pink-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="font-semibold text-sm">{content.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {content.platform} · {content.date}
                    </p>
                  </div>
                  <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', statusStyles[content.status])}>
                    {content.status}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(content)}
                      aria-label={`Éditer ${content.title}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold glass hover:bg-white/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Éditer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(content)}
                      aria-label={`Dupliquer ${content.title}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold glass hover:bg-white/10 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Dupliquer
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </motion.section>
      </div>
    </div>
  );
}
