// AfriLaunch AI — Social schedule API
// GET    /api/social/schedule — list scheduled publications
// DELETE /api/social/schedule — cancel a scheduled publication

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { promises as fs } from 'fs';
import path from 'path';
import type { Publication } from '../publish/route';

const PUBLICATIONS_PATH = path.join('/home/z/my-project/data', 'publications.json');

async function readPublications() {
  try {
    const raw = await fs.readFile(PUBLICATIONS_PATH, 'utf-8');
    return JSON.parse(raw) as { publications: Publication[] };
  } catch {
    return { publications: [] };
  }
}

async function writePublications(data: { publications: Publication[] }) {
  await fs.mkdir(path.dirname(PUBLICATIONS_PATH), { recursive: true });
  await fs.writeFile(PUBLICATIONS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const store = await readPublications();
  const scheduled = store.publications.filter(p => p.userId === user.id && p.status === 'scheduled');

  return NextResponse.json({ ok: true, publications: scheduled, count: scheduled.length });
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: { publicationId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  const store = await readPublications();
  const pub = store.publications.find(p => p.id === body.publicationId && p.userId === user.id);
  if (!pub) return NextResponse.json({ error: 'Publication non trouvée' }, { status: 404 });
  if (pub.status !== 'scheduled') return NextResponse.json({ error: 'Cette publication n\'est pas programmée' }, { status: 400 });

  pub.status = 'failed';
  pub.error = 'Annulé par l\'utilisateur';
  pub.updatedAt = new Date().toISOString();
  await writePublications(store);

  return NextResponse.json({ ok: true, message: 'Publication annulée' });
}
