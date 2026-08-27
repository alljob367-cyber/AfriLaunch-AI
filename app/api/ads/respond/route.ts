// AfriLaunch AI — Ads respond API
// POST /api/ads/respond — manually trigger AI response or override
// PATCH /api/ads/respond — mark item as read/starred

import { NextRequest, NextResponse } from 'next/server';
import { getAdsItemById, updateAdsItem } from '@/lib/ads-store';
import { autoRespondToAdsItem, postResponseToPlatform } from '@/lib/ads-responder';
import { requireUser } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { itemId?: string; manualResponse?: string; postToPlatform?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const item = await getAdsItemById(body.itemId || '');
  if (!item) return NextResponse.json({ error: 'Item introuvable' }, { status: 404 });

  // Manual override
  if (body.manualResponse !== undefined) {
    const updated = await updateAdsItem(item.id, {
      aiResponse: body.manualResponse,
      aiResponseStatus: 'manual',
      aiRespondedAt: new Date().toISOString(),
      isRead: true,
    });

    if (body.postToPlatform && body.manualResponse) {
      await postResponseToPlatform(item, body.manualResponse);
    }

    return NextResponse.json({ ok: true, item: updated });
  }

  // Auto-respond (retry)
  const result = await autoRespondToAdsItem(item);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  if (body.postToPlatform && result.response) {
    await postResponseToPlatform(item, result.response);
  }

  const updated = await getAdsItemById(item.id);
  return NextResponse.json({ ok: true, item: updated, response: result.response });
}

export async function PATCH(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { itemId?: string; isRead?: boolean; isStarred?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const updates: { isRead?: boolean; isStarred?: boolean } = {};
  if (body.isRead !== undefined) updates.isRead = body.isRead;
  if (body.isStarred !== undefined) updates.isStarred = body.isStarred;

  const updated = await updateAdsItem(body.itemId || '', updates);
  if (!updated) return NextResponse.json({ error: 'Item introuvable' }, { status: 404 });

  return NextResponse.json({ ok: true, item: updated });
}
