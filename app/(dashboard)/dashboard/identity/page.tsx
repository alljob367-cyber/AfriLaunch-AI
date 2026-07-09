// AfriLaunch AI — Identité de marque module
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Sparkles, Download, RefreshCw, Check, Wand2, Type, Droplet, FileImage } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { useToast } from '@/components/providers/toast-provider';
import { useStats } from '@/hooks/use-stats';
import { cn } from '@/lib/utils';

const palettes = [
  { name: 'Teranga', colors: ['#E63946', '#F1A208', '#06A77D', '#1D3557'] },
  { name: 'Sahel', colors: ['#D4A373', '#E9C46A', '#2A9D8F', '#264653'] },
  { name: 'Baobab', colors: ['#7B2D26', '#C1492E', '#F2A541', '#233D4D'] },
  { name: 'Lagune', colors: ['#0E6BA8', '#84A59D', '#F28F3B', '#F6BD60'] },
];

const logos = [
  { id: '1', name: 'Logo moderne', preview: '🚀', style: 'Minimaliste' },
  { id: '2', name: 'Logo emblème', preview: '⭐', style: 'Traditionnel' },
  { id: '3', name: 'Logo typographique', preview: 'T', style: 'Élégant' },
  { id: '4', name: 'Logo abstrait', preview: '◈', style: 'Contemporain' },
];

export default function IdentityPage() {
  const { toast } = useToast();
  const { stats } = useStats();
  const [generating, setGenerating] = useState(false);
  const [brandName, setBrandName] = useState('Teranga Mode');
  const [selectedPalette, setSelectedPalette] = useState(palettes[0]);

  const handleGenerate = async () => {
    if ((stats?.aiCredits ?? 0) < 20) {
      toast({ title: 'Crédits insuffisants', description: 'La génération d\'identité nécessite 20 crédits.', variant: 'error' });
      return;
    }
    setGenerating(true);
    toast({ title: 'Branding Agent lancé', description: 'Génération de 4 variants de logo...', variant: 'success' });
    await new Promise((r) => setTimeout(r, 2000));
    setGenerating(false);
    toast({ title: 'Identité générée !', description: '4 logos + 4 palettes disponibles. 20 crédits débités.', variant: 'success' });
  };

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        <ModuleHeader title="Identité de marque" description="Générez votre nom, logo, palette et charte graphique avec l'IA, adaptés au marché africain." icon={Palette} gradient="from-violet-500 to-purple-600"
          action={
            <button type="button" onClick={handleGenerate} disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:scale-105 transition-transform shadow-lg disabled:opacity-60">
              {generating ? <><RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> Génération...</> : <><Wand2 className="w-4 h-4" aria-hidden="true" /> Générer (20 crédits)</>}
            </button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand name */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-premium">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-violet-500" aria-hidden="true" />
              <h2 className="font-bold">Nom de marque</h2>
            </div>
            <label htmlFor="brand-name" className="text-xs font-semibold text-gray-400 mb-1.5 block">NOM</label>
            <input id="brand-name" type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 border border-white/5 focus:border-violet-500/50 outline-none text-sm" />
            <div className="mt-4 flex flex-wrap gap-2">
              {['Teranga Mode', 'Sahel Tech', 'Baobab Co', 'Lagune Studio'].map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => setBrandName(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-lg glass hover:bg-white/10 transition-colors">{suggestion}</button>
              ))}
            </div>
          </motion.section>

          {/* Palette */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium">
            <div className="flex items-center gap-2 mb-4">
              <Droplet className="w-5 h-5 text-violet-500" aria-hidden="true" />
              <h2 className="font-bold">Palette de couleurs</h2>
            </div>
            <div className="space-y-3">
              {palettes.map((p) => (
                <button key={p.name} type="button" onClick={() => setSelectedPalette(p)}
                  className={cn('w-full flex items-center gap-3 p-3 rounded-xl border transition-all', selectedPalette.name === p.name ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/5 glass hover:bg-white/10')}>
                  <div className="flex gap-1">
                    {p.colors.map((c) => (<div key={c} className="w-7 h-7 rounded-md" style={{ backgroundColor: c }} aria-label={c} />))}
                  </div>
                  <span className="font-semibold text-sm flex-1 text-left">{p.name}</span>
                  {selectedPalette.name === p.name && <Check className="w-4 h-4 text-violet-400" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </motion.section>

          {/* Logos */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-premium lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileImage className="w-5 h-5 text-violet-500" aria-hidden="true" />
                <h2 className="font-bold">Variants de logo</h2>
              </div>
              <span className="text-xs text-gray-500">Généré par Branding Agent</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {logos.map((logo) => (
                <div key={logo.id} className="glass rounded-2xl p-6 text-center hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                    {logo.preview}
                  </div>
                  <p className="font-semibold text-sm">{logo.name}</p>
                  <p className="text-xs text-gray-500 mb-3">{logo.style}</p>
                  <button type="button" onClick={() => toast({ title: 'Téléchargement', description: `${logo.name} (SVG + PNG + PDF)`, variant: 'success' })}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg glass hover:bg-white/10">
                    <Download className="w-3 h-3" aria-hidden="true" /> Télécharger
                  </button>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Brand summary */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-premium lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-500" aria-hidden="true" />
              <h2 className="font-bold">Charte graphique</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-xs text-gray-500 mb-1">Nom</p><p className="font-semibold">{brandName}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">Palette</p><p className="font-semibold">{selectedPalette.name}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">Police titre</p><p className="font-semibold">Poppins</p></div>
              <div><p className="text-xs text-gray-500 mb-1">Police corps</p><p className="font-semibold">Inter</p></div>
            </div>
            <button type="button" onClick={() => toast({ title: 'Charte téléchargée', description: 'PDF 12 pages généré', variant: 'success' })}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold glass hover:bg-white/10">
              <Download className="w-4 h-4" aria-hidden="true" /> Télécharger la charte complète (PDF)
            </button>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
