// AfriLaunch AI — YouTube Ads webhook (PubSubHubbub)
// GET  /api/ads/youtube/webhook — verify subscription
// POST /api/ads/youtube/webhook — receive new comment notifications (Atom XML)

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { addAdsItem } from '@/lib/ads-store';
import { autoRespondToAdsItem, postResponseToPlatform } from '@/lib/ads-responder';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const topic = url.searchParams.get('hub.topic');
  const challenge = url.searchParams.get('hub.challenge');
  const verifyToken = url.searchParams.get('hub.verify_token');

  const config = await getConfig();

  if (mode === 'subscribe' && verifyToken === config.ads.youtube.verifyToken) {
    return new NextResponse(challenge || 'ok', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  if (mode === 'unsubscribe' && verifyToken === config.ads.youtube.verifyToken) {
    return new NextResponse(challenge || 'ok', { status: 202, headers: { 'Content-Type': 'text/plain' } });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const config = await getConfig();
  if (!config.ads.youtube.enabled) {
    return NextResponse.json({ error: 'YouTube ads disabled' }, { status: 403 });
  }

  // YouTube sends Atom XML feed with new video/comment events
  const xml = await req.text();

  // Parse the Atom XML to extract comment info
  // In production, use a proper XML parser. Here we extract with regex for simplicity.
  const entryMatches = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];

  for (const entryXml of entryMatches) {
    const title = entryXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const author = entryXml.match(/<name>(.*?)<\/name>/)?.[1] || 'Utilisateur YouTube';
    const content = entryXml.match(/<content[^>]*>(.*?)<\/content>/)?.[1] || '';
    const link = entryXml.match(/<link[^>]*href="([^"]*)"[^>]*>/)?.[1] || '';
    const videoId = link.match(/v=([\w-]+)/)?.[1];

    if (content && content.trim()) {
      await handleYouTubeComment({
        authorName: author,
        authorId: undefined,
        message: decodeHtmlEntities(content.replace(/<[^>]+>/g, '').trim()),
        videoId,
        videoTitle: title,
        link,
      }, config);
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleYouTubeComment(data: {
  authorName: string;
  authorId?: string;
  message: string;
  videoId?: string;
  videoTitle?: string;
  link?: string;
}, config: Awaited<ReturnType<typeof getConfig>>) {
  const item = await addAdsItem({
    platform: 'youtube',
    type: 'comment',
    authorName: data.authorName,
    authorId: data.authorId,
    message: data.message,
    postUrl: data.link,
    postCaption: data.videoTitle,
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

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
