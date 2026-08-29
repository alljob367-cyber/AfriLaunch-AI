export const metadata = { title: "Politique de confidentialité — AfriLaunch AI" };
export default function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold mb-6">Politique de confidentialité</h1>
      <p className="text-gray-400 mb-4">Dernière mise à jour : 29 août 2026</p>
      <section className="space-y-4 text-sm text-gray-300 leading-relaxed">
        <h2 className="text-lg font-bold text-white mt-6">1. Données collectées</h2>
        <p>Nous collectons : nom, prénom, email, mot de passe (haché), informations de l'organisation (nom, industrie, pays), historique des conversations avec les agents IA, et preuves de paiement.</p>
        <h2 className="text-lg font-bold text-white mt-6">2. Hébergement</h2>
        <p>Les données sont stockées sur Supabase (PostgreSQL) avec chiffrement et Row-Level Security (RLS). Les serveurs sont situés en UE/USA.</p>
        <h2 className="text-lg font-bold text-white mt-6">3. Utilisation des données</h2>
        <p>Vos données sont utilisées pour : fournir le service, personnaliser les réponses des agents IA, traiter les paiements, améliorer la plateforme.</p>
        <h2 className="text-lg font-bold text-white mt-6">4. Partage avec des tiers</h2>
        <p>Vos données ne sont JAMAIS vendues. Elles peuvent être partagées avec : OpenRouter/Mistral/Cerebras (pour l'IA), Twilio (pour WhatsApp), Flutterwave/Stripe (pour les paiements) — uniquement dans le cadre de la fourniture du service.</p>
        <h2 className="text-lg font-bold text-white mt-6">5. Vos droits</h2>
        <p>Vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Contactez-nous : contact@afrilaunch.ai</p>
        <h2 className="text-lg font-bold text-white mt-6">6. Cookies</h2>
        <p>Nous utilisons un cookie de session (httpOnly) pour maintenir votre connexion. Aucun cookie de tracking publicitaire n'est utilisé.</p>
        <h2 className="text-lg font-bold text-white mt-6">7. Conservation</h2>
        <p>Vos données sont conservées pendant la durée de votre abonnement + 90 jours après résiliation, puis supprimées définitivement.</p>
      </section>
    </article>
  );
}
