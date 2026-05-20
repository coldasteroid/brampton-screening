import { cookies } from 'next/headers';
import { COOKIE_NAME, verifySession, type SessionUser } from '~/lib/auth';
import { env } from '~/lib/runtime';

// Replaces Astro middleware's `locals.user`. Read from any server component,
// server action, or route handler. Read-only `cookies()` returned in RSCs;
// mutable inside server actions and route handlers — that's a Next concern,
// not ours.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifySession(env(), token);
}

export { requireRole } from '~/lib/auth';
