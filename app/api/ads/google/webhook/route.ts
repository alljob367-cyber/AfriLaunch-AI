// AfriLaunch AI — Google Ads webhook (lead form extensions)
// POST /api/ads/google/webhook — receive lead form submissions

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config-store';
import { addAdsItem } from '@/lib/ads-store';
import { autoRespondToAdsItem } from '@/lib/ads-responder';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  const config = await getConfig();

  if (!config.ads.google.enabled) {
    return NextResponse.json({ error: 'Google Ads disabled' }, { status: 403 });
  }
  if (config.ads.google.leadFormWebhookSecret && secret !== config.ads.google.leadFormWebhookSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    // Google sometimes sends form-encoded data
    const text = await req.text();
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
  }

  // Google Ads lead form webhook payload structure
  // https://developers.google.com/google-ads/webhook
  const leads = Array.isArray(body) ? body : [body];

  for (const lead of leads) {
    if (!lead) continue;
    const item = await addAdsItem({
      platform: 'google',
      type: 'lead',
      authorName: lead.full_name || lead.name || 'Lead Google Ads',
      authorId: lead.gcl_id || lead.campaign_id?.toString(),
      message: `Lead form: ${lead.full_name || 'N/A'} - ${lead.email || 'sans email'} - Campagne: ${lead.campaign_name || 'N/A'}`,
      leadEmail: lead.email,
      leadPhone: lead.phone_number || lead.phone,
      leadName: lead.full_name || lead.name,
      postUrl: lead.campaign_id ? `https://ads.google.com/campaigns/${lead.campaign_id}` : undefined,
      postCaption: `Google Ads — ${lead.campaign_name || 'Campagne lead form'}`,
      userId: null,
    });

    if (config.ads.autoRespond) {
      setTimeout(async () => {
        const result = await autoRespondToAdsItem(item);
        if (result.ok && result.response && config.ads.google.autoEmailLead && lead.email) {
          // In production, send email via configured email provider
          // For now, the response is stored and visible in the dashboard
        }
      }, config.ads.autoRespondDelaySeconds * 1000);
    }
  }

  return NextResponse.json({ ok: true, received: leads.length });
}
