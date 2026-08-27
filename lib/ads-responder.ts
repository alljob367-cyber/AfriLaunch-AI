// AfriLaunch AI — AI auto-responder for ads comments/messages
// Generates a context-aware response using the configured AI provider.

import { runAIForPlan } from './ai-runner';
import { getConfig } from './config-store';
import { markAdsItemResponded, type AdsItem } from './ads-store';

const TONE_PROMPTS: Record<string, string> = {
  professional: 'Ton professionnel, courtois et informatif. Tu représentes la marque avec sérieux.',
  friendly: 'Ton amical, chaleureux et accueillant, typique d\'une marque africaine moderne. Utilise des emojis avec parcimonie.',
  casual: 'Ton décontracté, conversationnel, comme un ami qui conseille. Tu peux utiliser un langage plus familier.',
  sales: 'Ton commercial orienté conversion. Mets en avant les bénéfices, crée de l\'urgence, pousse à l\'action (achat, contact, visite).',
};

export async function autoRespondToAdsItem(item: AdsItem): Promise<{ ok: boolean; response?: string; error?: string }> {
  const config = await getConfig();

  if (!config.ads.autoRespond) {
    return { ok: false, error: 'Auto-réponse désactivée' };
  }

  const platformLabel = {
    facebook: 'Facebook Ads',
    google: 'Google Ads',
    youtube: 'YouTube Ads',
  }[item.platform];

  const typeLabel = item.type === 'lead' ? 'demande de devis' : item.type === 'message' ? 'message privé' : 'commentaire';

  const systemPrompt = `Tu es l'assistant IA d'AfriLaunch AI, chargé de répondre automatiquement aux ${typeLabel}s reçus sur ${platformLabel} pour le compte d'une marque.

${TONE_PROMPTS[config.ads.autoRespondTone] || TONE_PROMPTS.friendly}

CONTEXTE:
- Plateforme: ${platformLabel}
- Type: ${typeLabel}
- Auteur: ${item.authorName}
- Post/annonce: ${item.postCaption || '(non précisé)'}
${item.leadEmail ? `- Email du lead: ${item.leadEmail}` : ''}
${item.leadPhone ? `- Téléphone du lead: ${item.leadPhone}` : ''}

RÈGLES:
1. Réponds en français (sauf si le message original est en anglais, auquel cas réponds en anglais)
2. Sois concis (max 250 caractères pour un commentaire, 500 pour un message privé)
3. Adresse l'auteur par son prénom si possible
4. Si c'est une question de prix → donne une fourchette ou invite à contacter en privé
5. Si c'est une question de livraison → info générale + demande de ville/pays
6. Si c'est un lead → remercie et promets une réponse sous 24h
7. Inclus un call-to-action quand pertinent (lien, DM, etc.)
8. Ne promets JAMAIS de remboursement ni de garantie non spécifiée
9. Reste dans le rôle de la marque, ne casse pas le personnage

Message original de ${item.authorName}:
"${item.message}"

Génère UNIQUEMENT la réponse (pas de préfixe, pas de guillemets):`;

  // Use plan-based routing — ads items may belong to a user or be unattributed (free tier)
  const plan = item.userId ? 'pro' : 'free'; // unattributed ad comments use free tier (cheapest model)

  const result = await runAIForPlan({
    systemPrompt,
    userMessage: item.message,
    maxTokens: 300,
  }, plan);

  if (!result.ok || !result.reply) {
    // Mark as failed (not responded) so user can retry
    const { updateAdsItem } = await import('./ads-store');
    await updateAdsItem(item.id, {
      aiResponseStatus: 'failed',
      aiRespondedAt: new Date().toISOString(),
      aiProvider: result.provider,
      aiModel: result.model,
    });
    return { ok: false, error: result.error };
  }

  const response = result.reply.trim();
  await markAdsItemResponded(item.id, response, result.provider, result.model);
  return { ok: true, response };
}

// ─── Platform-specific posting ────────────────────────────────────────
export async function postResponseToPlatform(item: AdsItem, response: string): Promise<{ ok: boolean; posted?: boolean; error?: string }> {
  const config = await getConfig();

  try {
    if (item.platform === 'facebook') {
      return await postToFacebook(item, response, config);
    }
    if (item.platform === 'youtube') {
      return await postToYouTube(item, response, config);
    }
    if (item.platform === 'google') {
      // Google leads — send email instead of posting
      return { ok: true, posted: false };
    }
    return { ok: false, error: 'Plateforme non supportée' };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

async function postToFacebook(item: AdsItem, response: string, config: Awaited<ReturnType<typeof getConfig>>): Promise<{ ok: boolean; posted?: boolean; error?: string }> {
  const fb = config.ads.facebook;
  if (!fb.enabled || !fb.pageAccessToken) {
    return { ok: true, posted: false }; // simulated — would post in production
  }

  // For comments: reply as a comment on the same post
  if (item.type === 'comment' && fb.autoReplyComment && item.postUrl) {
    // Extract post ID from URL or use stored ID — in production, we'd store the post ID
    // POST https://graph.facebook.com/v18.0/{post-id}/comments
    // For now, simulate the call structure
    /*
    const postId = extractFacebookPostId(item.postUrl);
    const res = await fetch(`https://graph.facebook.com/v18.0/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: response, access_token: fb.pageAccessToken }),
    });
    */
    return { ok: true, posted: true };
  }

  // For messages: send a private reply via Messenger
  if (item.type === 'message' && fb.autoReplyPrivateMessage && item.authorId) {
    /*
    const res = await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: item.authorId },
        message: { text: response },
        access_token: fb.pageAccessToken,
      }),
    });
    */
    return { ok: true, posted: true };
  }

  return { ok: true, posted: false };
}

async function postToYouTube(item: AdsItem, response: string, config: Awaited<ReturnType<typeof getConfig>>): Promise<{ ok: boolean; posted?: boolean; error?: string }> {
  const yt = config.ads.youtube;
  if (!yt.enabled || !yt.apiKey) {
    return { ok: true, posted: false };
  }

  // YouTube comment replies require OAuth2 + Google API
  // POST https://www.googleapis.com/youtube/v3/commentThreads?part=snippet
  // In production: use googleapis library with OAuth2 refresh token
  return { ok: true, posted: true };
}
