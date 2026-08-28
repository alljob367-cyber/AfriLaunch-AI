// AfriLaunch AI — Social publisher (publish to Facebook, Instagram, LinkedIn, X, WhatsApp)
// POST /api/social/publish — publish now or schedule
// GET /api/social/publish — list user's publications
//
// Bug fix (2025-08): the previous version checked the admin's OAuth config to
// decide whether the user could publish. That was wrong — the user connects
// their OWN accounts in /dashboard/social (stored in social-store), and
// publishing should respect that user-level connection. The admin OAuth config
// is only required for platforms that genuinely need platform-level API keys
// (Facebook Graph, Instagram Graph, LinkedIn, X API). For WhatsApp, the user's
// own number is enough; we open a wa.me link.
//
// Behavior:
//   - If the user has NOT connected the platform → 400 "Connectez votre compte"
//   - If the user has connected BUT admin OAuth is missing → save as 'pending'
//     and return a 'manualShareUrl' (deep link) so the user can post manually
//     in 1 click.
//   - If both user + admin OAuth are configured → real publish via Graph API.

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getConfig } from '@/lib/config-store';
import { getSocialAccounts } from '@/lib/social-store';
import crypto from 'crypto';
import { kvGet, kvSet } from '@/lib/db';

export type PublicationStatus = 'pending' | 'publishing' | 'published' | 'failed' | 'scheduled' | 'manual';

export interface Publication {
  id: string;
  userId: string;
  platform: string;
  content: string;
  imageUrl?: string;
  status: PublicationStatus;
  scheduledAt?: string;
  publishedAt?: string;
  postUrl?: string;
  manualShareUrl?: string; // when admin OAuth is missing, user can share manually
  platformPostId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface PublicationsStore {
  publications: Publication[];
}

async function readPublications() {
  const store = await kvGet<PublicationsStore>('publications');
  return store ?? { publications: [] };
}

async function writePublications(data: PublicationsStore) {
  await kvSet('publications', data);
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { platform?: string; content?: string; imageUrl?: string; scheduledAt?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  if (!body.platform || !body.content?.trim()) {
    return NextResponse.json({ error: 'Plateforme et contenu requis' }, { status: 400 });
  }

  // ✅ Check that the USER has connected this platform
  const userAccounts = await getSocialAccounts(user.id);
  const userAccount = userAccounts.find(
    (a) => a.platform === body.platform && a.connected,
  );
  if (!userAccount) {
    return NextResponse.json({
      ok: false,
      error: `Connectez votre compte ${body.platform} dans Réseaux sociaux avant de publier.`,
      needConnect: true,
    }, { status: 400 });
  }

  const config = await getConfig();
  const now = new Date().toISOString();
  const pubId = 'pub_' + crypto.randomBytes(8).toString('hex');

  const publication: Publication = {
    id: pubId,
    userId: user.id,
    platform: body.platform,
    content: body.content.trim(),
    imageUrl: body.imageUrl,
    status: body.scheduledAt ? 'scheduled' : 'pending',
    scheduledAt: body.scheduledAt,
    createdAt: now,
    updatedAt: now,
  };

  // Save publication
  const store = await readPublications();
  store.publications.unshift(publication);
  if (store.publications.length > 500) store.publications = store.publications.slice(0, 500);
  await writePublications(store);

  // If scheduled, just save and return
  if (body.scheduledAt) {
    return NextResponse.json({ ok: true, publication, message: `Publication programmée pour ${new Date(body.scheduledAt).toLocaleString('fr-FR')}` });
  }

  // Publish now
  const result = await publishToPlatform(body.platform, body.content, body.imageUrl, config, userAccount.handle);

  publication.status = result.status;
  publication.publishedAt = result.ok ? new Date().toISOString() : undefined;
  publication.postUrl = result.postUrl;
  publication.manualShareUrl = result.manualShareUrl;
  publication.platformPostId = result.postId;
  publication.error = result.error;
  publication.updatedAt = new Date().toISOString();

  // Update store
  const store2 = await readPublications();
  const idx = store2.publications.findIndex((p) => p.id === pubId);
  if (idx >= 0) store2.publications[idx] = publication;
  await writePublications(store2);

  if (result.ok) {
    return NextResponse.json({
      ok: true,
      publication,
      manualShareUrl: result.manualShareUrl,
      message: result.manualShareUrl
        ? 'Publication prête — cliquez sur le lien pour la partager manuellement.'
        : 'Publication réussie !',
    });
  } else {
    return NextResponse.json({ ok: false, error: result.error, publication }, { status: 500 });
  }
}

// GET — list user's publications
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  const store = await readPublications();
  let pubs = store.publications.filter((p) => p.userId === user.id);
  if (status) pubs = pubs.filter((p) => p.status === status);

  return NextResponse.json({ ok: true, publications: pubs, count: pubs.length });
}

// ─── Platform publishing logic ────────────────────────────────────────
interface PublishResult {
  ok: boolean;
  status: PublicationStatus;
  postUrl?: string;
  manualShareUrl?: string;
  postId?: string;
  error?: string;
}

async function publishToPlatform(
  platform: string,
  content: string,
  imageUrl: string | undefined,
  config: any,
  userHandle: string,
): Promise<PublishResult> {
  try {
    if (platform === 'facebook') return await publishFacebook(content, imageUrl, config, userHandle);
    if (platform === 'instagram') return await publishInstagram(content, imageUrl, config, userHandle);
    if (platform === 'linkedin') return await publishLinkedIn(content, imageUrl, config, userHandle);
    if (platform === 'twitter') return await publishTwitter(content, imageUrl, config, userHandle);
    if (platform === 'whatsapp') return await publishWhatsApp(content, userHandle);
    if (platform === 'tiktok') return { ok: false, status: 'failed', error: 'TikTok nécessite une vidéo (non supporté pour le texte)' };
    return { ok: false, status: 'failed', error: 'Plateforme non supportée' };
  } catch (err) {
    return { ok: false, status: 'failed', error: (err as Error).message };
  }
}

async function publishFacebook(content: string, _imageUrl: string | undefined, config: any, userHandle: string): Promise<PublishResult> {
  const fb = config.social?.facebook;
  if (!fb?.enabled || !fb.pageAccessToken || !fb.pageId) {
    // Admin OAuth missing — return a manual share URL
    return {
      ok: true,
      status: 'manual',
      manualShareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(_imageUrl || '')}&quote=${encodeURIComponent(content)}`,
    };
  }
  const params = new URLSearchParams({
    message: content,
    access_token: fb.pageAccessToken,
  });
  if (_imageUrl) params.set('link', _imageUrl);

  const res = await fetch(`https://graph.facebook.com/v18.0/${fb.pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  if (!data.id) return { ok: false, status: 'failed', error: data.error?.message || 'Erreur Facebook' };
  return { ok: true, status: 'published', postId: data.id, postUrl: `https://facebook.com/${data.id}` };
}

async function publishInstagram(content: string, imageUrl: string | undefined, config: any, _userHandle: string): Promise<PublishResult> {
  const ig = config.social?.instagram;
  if (!ig?.enabled || !ig.accessToken || !ig.businessAccountId) {
    return {
      ok: true,
      status: 'manual',
      manualShareUrl: `https://www.instagram.com/`,
    };
  }
  if (!imageUrl) return { ok: false, status: 'failed', error: 'Instagram nécessite une image' };

  // Step 1: Create media container
  const createRes = await fetch(`https://graph.facebook.com/v18.0/${ig.businessAccountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: content,
      access_token: ig.accessToken,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const createData = await createRes.json();
  if (!createData.id) return { ok: false, status: 'failed', error: createData.error?.message || 'Erreur création media IG' };

  // Step 2: Publish
  const pubRes = await fetch(`https://graph.facebook.com/v18.0/${ig.businessAccountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: createData.id,
      access_token: ig.accessToken,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const pubData = await pubRes.json();
  if (!pubData.id) return { ok: false, status: 'failed', error: pubData.error?.message || 'Erreur publication IG' };
  return { ok: true, status: 'published', postId: pubData.id, postUrl: `https://instagram.com/p/${pubData.id}` };
}

async function publishLinkedIn(content: string, _imageUrl: string | undefined, config: any, _userHandle: string): Promise<PublishResult> {
  const li = config.social?.linkedin;
  if (!li?.enabled || !li.accessToken || !li.clientId) {
    return {
      ok: true,
      status: 'manual',
      manualShareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(_imageUrl || '')}&summary=${encodeURIComponent(content)}`,
    };
  }

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${li.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: `urn:li:organization:${li.clientId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: _imageUrl ? 'IMAGE' : 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  if (!data.id) return { ok: false, status: 'failed', error: data.message || 'Erreur LinkedIn' };
  return { ok: true, status: 'published', postId: data.id, postUrl: `https://linkedin.com/feed/update/${data.id}` };
}

async function publishTwitter(content: string, _imageUrl: string | undefined, config: any, userHandle: string): Promise<PublishResult> {
  const tw = config.social?.twitter;
  if (!tw?.enabled || !tw.apiKey || !tw.accessToken) {
    // Manual share — X web intent
    const text = encodeURIComponent(content.slice(0, 280));
    const url = _imageUrl ? `&url=${encodeURIComponent(_imageUrl)}` : '';
    return {
      ok: true,
      status: 'manual',
      manualShareUrl: `https://twitter.com/intent/tweet?text=${text}${url}`,
    };
  }
  // X API v2 requires OAuth 1.0a — complex. Fall back to web intent.
  const text = encodeURIComponent(content.slice(0, 280));
  return {
    ok: true,
    status: 'manual',
    manualShareUrl: `https://twitter.com/intent/tweet?text=${text}`,
  };
}

async function publishWhatsApp(content: string, userHandle: string): Promise<PublishResult> {
  // WhatsApp doesn't have a "broadcast to all contacts" API — we open a
  // wa.me link prefilled with the message so the user can pick recipients.
  // Use the user's own handle (phone) as the default target.
  const phone = userHandle.replace(/[^0-9]/g, '');
  const text = encodeURIComponent(content.slice(0, 4096));
  return {
    ok: true,
    status: 'manual',
    manualShareUrl: `https://wa.me/${phone}?text=${text}`,
  };
}
