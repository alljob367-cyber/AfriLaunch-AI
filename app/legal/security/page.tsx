export const metadata = { title: "Sécurité — AfriLaunch AI" };
export default function SecurityPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold mb-6">Sécurité</h1>
      <section className="space-y-4 text-sm text-gray-300 leading-relaxed">
        <h2 className="text-lg font-bold text-white mt-6">Chiffrement</h2>
        <p>Toutes les communications sont chiffrées via HTTPS/TLS 1.3. Les mots de passe sont hachés avec SHA-256 + sel. Les clés API sont stockées chiffrées dans Supabase.</p>
        <h2 className="text-lg font-bold text-white mt-6">Row-Level Security (RLS)</h2>
        <p>Supabase RLS est activé : chaque utilisateur ne peut accéder qu'à ses propres données. Les requêtes cross-user sont rejetées au niveau base de données.</p>
        <h2 className="text-lg font-bold text-white mt-6">Sessions</h2>
        <p>Les sessions utilisent des tokens aléatoires (32 bytes) stockés en httpOnly cookies. Durée : 7 jours. Déconnexion détruit le token côté serveur.</p>
        <h2 className="text-lg font-bold text-white mt-6">Paiements</h2>
        <p>Les preuves de paiement sont stockées en base (base64). Les clés Stripe/Flutterwave ne sont jamais exposées côté client.</p>
        <h2 className="text-lg font-bold text-white mt-6">Signaler une vulnérabilité</h2>
        <p>Si vous découvrez une faille de sécurité, contactez-nous immédiatement : contact@afrilaunch.ai</p>
      </section>
    </article>
  );
}
