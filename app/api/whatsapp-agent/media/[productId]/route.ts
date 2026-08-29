// AfriLaunch AI — Public media endpoint for WhatsApp product images
// GET /api/whatsapp-agent/media/[productId]?userId=xxx
//
// Twilio WhatsApp requires a PUBLIC URL for MediaUrl (it fetches the image
// from Twilio's servers, not the user's browser). Data URLs (base64) don't
// work with Twilio. This endpoint serves the product image as a real PNG
// so Twilio can fetch it.
//
// The productId + userId are needed to find the catalog entry in the
// whatsapp-agent-store. We accept userId as a query param (not very secure
// but sufficient for serving product images — they're meant to be public
// anyway since they'll be shared on WhatsApp).

import { NextRequest, NextResponse } from 'next/server';
import { getUserConfig } from '@/lib/whatsapp-agent-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  if (!userId || !productId) {
    return new NextResponse('Missing userId or productId', { status: 400 });
  }

  const config = await getUserConfig(userId);
  const product = config.catalog.find((p) => p.id === productId);
  if (!product || !product.imageUrl) {
    return new NextResponse('Image not found', { status: 404 });
  }

  // product.imageUrl is a data URL: "data:image/png;base64,...."
  // or "data:image/jpeg;base64,...."
  const dataUrl = product.imageUrl;
  const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/i);
  if (!match) {
    // If it's already an external URL (http/https), redirect to it
    if (dataUrl.startsWith('http')) {
      return NextResponse.redirect(dataUrl);
    }
    return new NextResponse('Invalid image format', { status: 400 });
  }

  const contentType = match[1]; // e.g. "image/png"
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // cache 24h (Twilio fetches once)
      'Content-Length': String(buffer.length),
    },
  });
}
