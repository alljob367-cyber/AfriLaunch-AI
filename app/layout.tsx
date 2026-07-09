// AfriLaunch AI — Root Layout
import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | AfriLaunch AI',
    default: 'AfriLaunch AI — Lancez votre présence digitale en Afrique',
  },
  description:
    'La plateforme tout-en-un pour entrepreneurs africains. Créez votre identité de marque, vos réseaux sociaux, votre site web et vos contenus grâce à l\'IA.',
  keywords: [
    'entrepreneur africain', 'startup afrique', 'présence digitale', 'IA marketing',
    'création logo', 'site web afrique', 'réseaux sociaux', 'AfriLaunch',
  ],
  authors: [{ name: 'AfriLaunch AI Team' }],
  creator: 'AfriLaunch AI',
  metadataBase: new URL('https://afrilaunch.ai'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://afrilaunch.ai',
    title: 'AfriLaunch AI',
    description: 'Lancez votre présence digitale en Afrique avec l\'IA',
    siteName: 'AfriLaunch AI',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AfriLaunch AI',
    description: 'Lancez votre présence digitale en Afrique avec l\'IA',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            <AuthProvider>
              <AnalyticsProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </AnalyticsProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
