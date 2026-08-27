// AfriLaunch AI — Facebook Ads webhook
// GET  /api/ads/facebook/webhook — webhook verification (Facebook challenge)
// POST /api/ads/facebook/webhook — receive comments, messages, lead events

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { addAdsItem } from '@/lib/ads-store';
import { autoRespondToAdsItem, postResponseToPlatform } from '@/lib/ads-responder';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const config = await getConfig();

  if (mode === 'subscribe' && token === config.ads.facebook.verifyToken) {
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const config = await getConfig();

  if (!config.ads.facebook.enabled) {
    return NextResponse.json({ error: 'Facebook ads disabled' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Facebook sends entries array
  const entries = body.entry || [];
  for (const entry of entries) {
    // Page feed (comments on posts/ads)
    const changes = entry.changes || [];
    for (const change of changes) {
      if (change.field === 'feed' && change.value?.item === 'comment' && change.value?.message) {
        await handleFacebookComment(change.value, config);
      }
      if (change.field === 'leadgen') {
        await handleFacebookLead(change.value, config);
      }
    }

    // Messenger messages (DMs)
    const messaging = entry.messaging || [];
    for (const msg of messaging) {
      if (msg.message?.text) {
        await handleFacebookMessage(msg, config);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleFacebookComment(value: any, config: Awaited<ReturnType<typeof getConfig>>) {
  const item = await addAdsItem({
    platform: 'facebook',
    type: 'comment',
    authorName: value.from?.name || 'Utilisateur Facebook',
    authorId: value.from?.id,
    message: value.message,
    postUrl: value.post_id ? `https://facebook.com/${value.post_id}` : undefined,
    postCaption: value.post?.message?.slice(0, 100),
    userId: null,
  });

  // Auto-respond asynchronously (don't block the webhook)
  if (config.ads.autoRespond) {
    setTimeout(async () => {
      const result = await autoRespondToAdsItem(item);
      if (result.ok && result.response) {
        await postResponseToPlatform(item, result.response);
      }
    }, config.ads.autoRespondDelaySeconds * 1000);
  }
}

async function handleFacebookMessage(msg: any, config: Awaited<ReturnType<typeof getConfig>>) {
  const item = await addAdsItem({
    platform: 'facebook',
    type: 'message',
    authorName: msg.sender?.id || 'Utilisateur Messenger',
    authorId: msg.sender?.id,
    message: msg.message.text,
    postUrl: `https://m.me/${msg.recipient?.id}`,
    postCaption: 'Message privé Messenger',
    userId: null,
  });

  if (config.ads.autoRespond) {
    setTimeout(async () => {
      const result = await autoRespondToAdsItem(item);
      if (result.ok && result.response) {
        await postResponseToPlatform(item, result.response);
      }
    }, config.ads.autoRespondDelaySeconds * 1000);
  }
}

async function handleFacebookLead(value: any, config: Awaited<ReturnType<typeof getConfig>>) {
  const leadData = value.leadgen_data || value;
  const item = await addAdsItem({
    platform: 'facebook',
    type: 'lead',
    authorName: leadData.full_name || leadData.first_name || 'Lead Facebook',
    authorId: value.ad_id?.toString(),
    message: `Lead form soumis: ${leadData.email || 'sans email'}`,
    leadEmail: leadData.email,
    leadPhone: leadData.phone_number,
    leadName: leadData.full_name,
    postUrl: value.form_id ? `https://facebook.com/lead/${value.form_id}` : undefined,
    postCaption: 'Facebook Lead Form Ad',
    userId: null,
  });

  if (config.ads.autoRespond) {
    setTimeout(async () => {
      const result = await autoRespondToAdsItem(item);
      if (result.ok && result.response) {
        await postResponseToPlatform(item, result.response);
      }
    }, config.ads.autoRespondDelaySeconds * 1000);
  }
}
