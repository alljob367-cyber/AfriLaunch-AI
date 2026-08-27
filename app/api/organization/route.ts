// AfriLaunch AI — Organization API
// GET  /api/organization — get current user's organization
// POST /api/organization — create or update organization

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { createOrganization, getOrganizationByUserId, sanitizeOrg } from '@/lib/org-store';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const org = await getOrganizationByUserId(user.id);
  return NextResponse.json({ ok: true, organization: org ? sanitizeOrg(org) : null });
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body: {
    name?: string;
    description?: string;
    country?: string;
    industry?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    logo?: string | null;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
  }

  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: 'Le nom de l\'organisation est requis' }, { status: 400 });
  }

  const org = await createOrganization({
    userId: user.id,
    name: body.name.trim(),
    description: body.description || '',
    country: body.country || 'Cameroun',
    industry: body.industry || '',
    website: body.website || '',
    email: body.email || user.email,
    phone: body.phone || '',
    address: body.address || '',
    logo: body.logo ?? null,
  });

  return NextResponse.json({ ok: true, organization: sanitizeOrg(org) });
}
