// AfriLaunch AI — YouTube video file serving
// GET /api/youtube/file?key=... — serves a stored video file back to the user
//
// Auth required: the user must be authenticated (the storageKey contains the
// userId, so we could verify ownership — but for simplicity we just check
// that the user is logged in).
//
// Returns the video file with proper Content-Type + support for HTTP Range
// requests (so the browser can seek in the video).

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getFile } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'key requis' }, { status: 400 });
    }

    // Basic ownership check: the storageKey for user uploads starts with `yt-upload_<userId>_`
    // We extract the userId from the key and compare with the logged-in user.
    const match = key.match(/^yt-upload_([^_]+)_/);
    if (match && match[1] !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const stored = await getFile(key);
    if (!stored) {
      return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
    }

    const buffer = stored.data;
    const mime = stored.mimeType;

    // Support HTTP Range requests for video seeking
    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      // Parse "bytes=start-end"
      const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
      if (m) {
        const start = m[1] ? parseInt(m[1], 10) : 0;
        const end = m[2] ? parseInt(m[2], 10) : buffer.length - 1;
        const clampedEnd = Math.min(end, buffer.length - 1);
        const chunk = buffer.subarray(start, clampedEnd + 1);
        const blobPart = chunk as unknown as ArrayBuffer;
        const blob = new Blob([blobPart], { type: mime });
        return new NextResponse(blob, {
          status: 206,
          headers: {
            'Content-Type': mime,
            'Content-Length': String(chunk.length),
            'Content-Range': `bytes ${start}-${clampedEnd}/${buffer.length}`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'private, no-store',
          },
        });
      }
    }

    // Full file
    const blobPart = buffer as unknown as ArrayBuffer;
    const blob = new Blob([blobPart], { type: mime });
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(buffer.length),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[youtube/file] error:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
