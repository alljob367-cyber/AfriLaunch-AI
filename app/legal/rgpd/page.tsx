export const metadata = { title: "RGPD — AfriLaunch AI" };
export default function RgpdPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold mb-6">Conformité RGPD</h1>
      <section className="space-y-4 text-sm text-gray-300 leading-relaxed">
        <h2 className="text-lg font-bold text-white mt-6">Règlement Général sur la Protection des Données</h2>
        <p>AfriLaunch AI est conforme au RGPD (Règlement UE 2016/679) et à la loi camerounaise sur la protection des données personnelles (Loi n°2010/012).</p>
        <h2 className="text-lg font-bold text-white mt-6">Vos droits RGPD</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Droit d'accès</strong> : obtenez une copie de vos données</li>
          <li><strong>Droit de rectification</strong> : corrigez des données inexactes</li>
          <li><strong>Droit à l'effacement</strong> : supprimez votre compte et vos données</li>
          <li><strong>Droit à la portabilité</strong> : exportez vos données</li>
          <li><strong>Droit d'opposition</strong> : refusez le traitement de vos données</li>
          <li><strong>Droit à la limitation</strong> : limitez le traitement</li>
        </ul>
        <h2 className="text-lg font-bold text-white mt-6">Exercer vos droits</h2>
        <p>Envoyez un email à : contact@afrilaunch.ai avec l'objet « Exercice de droits RGPD ». Nous répondons sous 30 jours maximum.</p>
        <h2 className="text-lg font-bold text-white mt-6">Délégué à la protection des données</h2>
        <p>Le DPO de AfriLaunch AI peut être contacté à : contact@afrilaunch.ai</p>
      </section>
    </article>
  );
}
