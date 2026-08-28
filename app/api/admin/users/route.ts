// AfriLaunch AI — Admin users API
// GET  /api/admin/users — list all users (admin only)
// DELETE /api/admin/users?id=xxx — delete a user (admin only, blocks admins)

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/config-store';
import { getAllUsers, deleteUser, sanitizeUser } from '@/lib/user-store';

async function requireAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('afrilaunch_admin')?.value;
  if (!token) return false;
  return validateSession(token);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const users = await getAllUsers();

  // Compute summary stats from real data
  const total = users.length;
  const active = users.filter((u) => u.planStatus === 'active').length;
  const pendingPayment = users.filter((u) => u.planStatus === 'pending_payment').length;
  const admins = users.filter((u) =>
    (u as any).isAdmin === true ||
    u.email === 'admin@albermon.com' ||
    u.email === 'admin@afrilaunch.ai',
  ).length;
  const newThisMonth = users.filter((u) => {
    const created = new Date(u.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  return NextResponse.json({
    ok: true,
    users: users.map(sanitizeUser),
    stats: { total, active, pendingPayment, admins, newThisMonth },
  });
}

export async function DELETE(req: NextRequest) {
  const ok = await requireAuth(req);
  if (!ok) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const result = await deleteUser(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
