export const metadata = { title: "À propos — AfriLaunch AI" };
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-6">À propos d'AfriLaunch AI</h1>
        <p className="text-gray-400 text-lg mb-8">
          La plateforme tout-en-un pour entrepreneurs africains. 13 agents IA spécialisés pour automatiser votre business.
        </p>
        <section className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Notre mission</h2>
            <p>Démocratiser l'accès à l'IA pour les entrepreneurs africains. Que vous soyez à Douala, Dakar, Abidjan ou Lagos, AfriLaunch AI vous donne les outils pour lancer et scaler votre business avec l'intelligence artificielle.</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Nos valeurs</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Made in Africa — pensé pour les réalités africaines</li>
              <li>Accessibilité — à partir de 5 000 FCFA/mois</li>
              <li>Innovation — 13 agents IA + load balancer multi-provider</li>
              <li>Communauté — parrainage, marketplace d'agents</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Technologie</h2>
            <p>Next.js 16, React 19, Supabase, OpenRouter, Cerebras, Mistral, Pollinations.ai, Twilio WhatsApp. Hébergé sur Vercel.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
