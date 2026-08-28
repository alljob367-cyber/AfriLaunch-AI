// AfriLaunch AI — Public site serving route
// GET /s/[slug] → serves the raw HTML with proper Content-Type
//
// This is a route handler (not a page) so we can return HTML directly
// without Next.js wrapping it in the app layout. The HTML is a complete
// document with its own <html><head><body>.
//
// SEO: we inject Open Graph + Twitter Card meta tags into the <head> so
// links preview nicely when shared on WhatsApp, Facebook, Twitter, etc.
// View counter is incremented best-effort on each request.

import { NextRequest } from 'next/server';
import { getSiteBySlug, incrementViews } from '@/lib/sites-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Inject SEO/OG meta tags into the HTML <head>
function injectSeoTags(html: string, opts: { title: string; description?: string; slug: string; baseUrl: string; ogImage?: string }): string {
  const { title, description, slug, baseUrl, ogImage } = opts;
  const url = `${baseUrl}/s/${slug}`;
  const desc = description || `${title} — site créé avec AfriLaunch AI`;
  const image = ogImage || '';

  const metaTags = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />`,
    `<meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />`,
    `<meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />`,
    `<meta name="description" content="${desc.replace(/"/g, '&quot;')}" />`,
    `<link rel="canonical" href="${url}" />`,
  ];
  if (image) {
    metaTags.push(`<meta property="og:image" content="${image}" />`);
    metaTags.push(`<meta name="twitter:image" content="${image}" />`);
  }
  const metaBlock = `\n<!-- AfriLaunch AI — auto-published site -->\n${metaTags.join('\n')}\n`;

  // Inject right after <head> (or before </head> as fallback)
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => match + metaBlock);
  }
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, metaBlock + '</head>');
  }
  // No <head> — prepend
  return metaBlock + html;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug) return new Response('Not found', { status: 404 });

  const site = await getSiteBySlug(slug);
  if (!site) {
    return new Response(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Site introuvable</title></head><body style="font-family:system-ui;background:#0a0a0f;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center"><div><h1 style="font-size:48px;margin:0">404</h1><p style="color:#888;margin:16px 0">Ce site n'existe pas ou a été supprimé.</p><a href="https://afrilaunch.ai" style="color:#6366f1;text-decoration:none">← Retour à AfriLaunch AI</a></div></body></html>`,
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  // Increment view counter (best-effort, non-blocking)
  incrementViews(slug).catch(() => {});

  // Determine base URL for SEO absolute links
  const vercelUrl = req.headers.get('x-vercel-url');
  const baseUrl = vercelUrl ? `https://${vercelUrl}` : new URL(req.url).origin;

  // Inject SEO tags
  const finalHtml = injectSeoTags(site.html, {
    title: site.title,
    description: site.metaDescription,
    slug: site.slug,
    baseUrl,
    ogImage: site.ogImage,
  });

  return new Response(finalHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
      // Basic security headers — the published HTML is sandboxed from the main app
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer-when-downgrade',
    },
  });
}
