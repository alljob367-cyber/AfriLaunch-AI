// AfriLaunch AI — Auth helpers for API routes
// Reads the `afrilaunch_user` cookie and returns the validated user (or null).

import { NextRequest } from 'next/server';
import { validateUserSession, type User } from '@/lib/user-store';

export async function requireUser(req: NextRequest): Promise<User | null> {
  const token = req.cookies.get('afrilaunch_user')?.value;
  if (!token) return null;
  return validateUserSession(token);
}

// Cookie options shared across auth routes (7-day session).
export const USER_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 3600, // 7 days, in seconds
  path: '/',
};
