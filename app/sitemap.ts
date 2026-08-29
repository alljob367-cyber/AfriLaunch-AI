// AfriLaunch AI — sitemap.xml (dynamic)
// Generated via Next.js metadata route → /sitemap.xml

import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://afrilaunch.ai';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    lastModified?: Date;
  }> = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly', lastModified: now },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/blog', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/login', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/register', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/security', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/rgpd', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/api-docs', priority: 0.4, changeFrequency: 'monthly' },
  ];

  return routes.map(({ path, priority, changeFrequency, lastModified }) => ({
    url: `${APP_URL}${path}`,
    lastModified: lastModified ?? now,
    changeFrequency,
    priority,
  }));
}
