'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { buildCookie, COOKIE_NAME, createUser, signSession, type SessionUser } from '~/lib/auth';
import { env } from '~/lib/runtime';

export interface SignupActionState {
  error: string | null;
  email: string;
  name: string;
}

export async function signUpAction(
  _prev: SignupActionState,
  form: FormData,
): Promise<SignupActionState> {
  const email = String(form.get('email') ?? '').trim();
  const name = String(form.get('name') ?? '').trim();
  const password = String(form.get('password') ?? '');

  if (!email || !name || !password) {
    return { error: 'Please fill in name, email, and password.', email, name };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.', email, name };
  }

  const e = env();
  let user;
  try {
    user = await createUser(e.DB, { email, name, password });
  } catch (err) {
    return { error: (err as Error).message, email, name };
  }

  const token = await signSession(e, user);
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
