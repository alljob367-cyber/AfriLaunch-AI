// AfriLaunch AI — Link Telegram account
'use client';

import { useState, useEffect } from 'react';
import { Send, Link2, Check, Loader2, Info } from 'lucide-react';
import { ModuleHeader } from '@/components/dashboard/module-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useToast } from '@/components/providers/toast-provider';

export default function TelegramLinkPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          if (data.user.telegramUsername) setTelegramUsername(data.user.telegramUsername);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLink() {
    if (!telegramUsername.trim()) {
      toast({ title: 'Erreur', description: 'Entrez votre username Telegram', variant: 'error' });
      return;
    }
    setLinking(true);
    try {
      // Step 1: send the user to the bot with a /link command containing their user ID
      // In production, the bot would verify the user's Telegram ID matches.
      // For this demo, we use the username as the link.
      const res = await fetch('/api/users/telegram-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          telegramUserId: Date.now(), // demo: generate a fake ID
          telegramUsername: telegramUsername.replace('@', ''),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setUser(data.user);
        toast({
          title: 'Compte Telegram lié ! ✅',
          description: `Vous pouvez maintenant utiliser le bot avec @${telegramUsername.replace('@', '')}`,
          variant: 'success',
        });
      } else {
        toast({ title: 'Échec', description: data.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: (err as Error).message, variant: 'error' });
    } finally {
      setLinking(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" aria-hidden="true" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen mesh-bg">
        <div className="relative z-10 p-6 md:p-8 max-w-2xl mx-auto">
          <ModuleHeader title="Lier Telegram" description="Connectez votre compte Telegram pour utiliser les agents IA" icon={Send} gradient="from-sky-500 to-blue-600" />
          <EmptyState icon={Send} title="Connectez-vous" description="Vous devez être connecté pour lier votre compte Telegram." action={{ label: 'Se connecter', href: '/login' }} gradient="from-sky-500 to-blue-600" />
        </div>
      </div>
    );
  }

  const isLinked = !!user.telegramUserId;

  return (
    <div className="min-h-screen mesh-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-2xl mx-auto">
        <ModuleHeader
          title="Lier Telegram"
          description="Connectez votre compte Telegram pour utiliser les 13 agents IA via le bot."
          icon={Send}
          gradient="from-sky-500 to-blue-600"
        />

        <div className="space-y-6">
          {/* Status */}
          <div className={`glass rounded-2xl p-6 border ${isLinked ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLinked ? 'bg-green-500' : 'bg-amber-500'}`}>
                {isLinked ? <Check className="w-5 h-5 text-white" aria-hidden="true" /> : <Info className="w-5 h-5 text-white" aria-hidden="true" />}
              </div>
              <div>
                <p className="font-bold">{isLinked ? 'Compte Telegram lié' : 'Compte Telegram non lié'}</p>
                <p className="text-xs text-gray-400">
                  {isLinked
                    ? `Connecté en tant que @${user.telegramUsername}`
                    : 'Lie votre compte pour activer le bot Telegram'}
                </p>
              </div>
            </div>
          </div>

          {/* Link form */}
          {!isLinked && (
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h2 className="font-bold text-base mb-4">Lier votre compte</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="tg-username" className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">USERNAME TELEGRAM</label>
                  <div className="flex items-center gap-2 glass rounded-xl px-4 py-3 border border-white/5 focus-within:border-sky-500/40 transition-colors">
                    <span className="text-gray-500">@</span>
                    <input
                      id="tg-username"
                      type="text"
                      value={telegramUsername}
                      onChange={(e) => setTelegramUsername(e.target.value)}
                      placeholder="votre_username"
                      className="bg-transparent flex-1 outline-none text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1">Votre username Telegram (sans le @)</p>
                </div>

                <button
                  type="button"
                  onClick={handleLink}
                  disabled={linking}
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-sky-500 to-blue-600 hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {linking ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Liaison...</> : <><Link2 className="w-4 h-4" aria-hidden="true" /> Lier mon compte</>}
                </button>
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="font-bold text-base mb-4">Comment ça marche ?</h2>
            <ol className="space-y-3">
              {[
                { step: '1', title: 'Configurez le bot', desc: 'L\'admin configure le bot Telegram une seule fois dans /admin/telegram' },
                { step: '2', title: 'Lie votre compte', desc: 'Entrez votre username Telegram ci-dessus' },
                { step: '3', title: 'Discutez avec les agents', desc: 'Ouvrez le bot sur Telegram et envoyez /start pour commencer' },
                { step: '4', title: '1 message = 1 crédit', desc: 'Chaque message consomme 1 crédit de votre abonnement' },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Commands preview */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="font-bold text-base mb-4">Commandes disponibles sur Telegram</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                '/start — Bienvenue',
                '/help — Aide',
                '/agents — Liste agents',
                '/branding — Logo & charte',
                '/content — Posts & reels',
                '/seo — Référencement',
                '/ads — Publicités',
                '/support — Service client',
                '/analytics — Analytics',
                '/ecommerce — Boutique',
                '/email — Newsletter',
                '/video — Scripts vidéo',
                '/translate — Traduction',
                '/dev — Code & API',
                '/legal — Contrats',
                '/growth — Stratégie',
              ].map((cmd) => (
                <code key={cmd} className="px-2 py-1.5 rounded-lg bg-black/30 text-sky-300 font-mono">{cmd}</code>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
