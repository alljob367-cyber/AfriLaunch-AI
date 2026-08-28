// AfriLaunch AI — Social accounts API
// GET /api/social/accounts — list user's connected accounts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { getSocialAccounts, sanitizeAccount } from '@/lib/social-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const accounts = await getSocialAccounts(user.id);
  const res = NextResponse.json({
    ok: true,
    accounts: accounts.map(sanitizeAccount),
    count: accounts.length,
  });
  // Don't cache — list changes when user connects/disconnects.
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}
