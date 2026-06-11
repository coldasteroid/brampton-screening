'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  buildCookie,
  COOKIE_NAME,
  findUserByEmail,
  seedDemoUsersIfNeeded,
  signSession,
  verifyPassword,
  type SessionUser,
} from '~/lib/auth';
import { logAudit } from '~/lib/db';
import { env } from '~/lib/runtime';

export interface LoginActionState {
  error: string | null;
  email: string;
}

export async function signInAction(
  _prev: LoginActionState,
  form: FormData,
): Promise<LoginActionState> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.', email };
  }

  const e = env();
  await seedDemoUsersIfNeeded(e.DB);

  const row = await findUserByEmail(e.DB, email);
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return { error: 'No account matches that email and password.', email };
  }

  const user: SessionUser = { id: row.id, email: row.email, name: row.name, role: row.role };
  const token = await signSession(e, user);
  await logAudit(e.DB, { actor: `user:${row.id}`, action: 'login' });

  // Mirror Astro's `buildCookie` so attributes (Secure, HttpOnly, SameSite,
  // Max-Age) match exactly. Easier to keep one source of truth than reimplement.
  const cookieStr = buildCookie(token, e.ENV !== 'dev');
  const value = cookieStr.split(';')[0].slice(COOKIE_NAME.length + 1);
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: e.ENV !== 'dev',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(landingFor(user.role));
}

function landingFor(role: SessionUser['role']): string {
  if (role === 'officer') return '/officer';
  if (role === 'manager') return '/manager';
  return '/my-notices';
}
