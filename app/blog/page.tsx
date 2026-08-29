export const metadata = { title: "Blog — AfriLaunch AI" };
export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold mb-6">Blog</h1>
        <p className="text-gray-400 text-lg mb-8">Bientôt disponible — articles sur l'entrepreneuriat en Afrique, l'IA et le digital.</p>
        <a href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:scale-105 transition-transform">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
