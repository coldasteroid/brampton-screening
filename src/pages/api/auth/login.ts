import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  buildCookie,
  findUserByEmail,
  seedDemoUsersIfNeeded,
  signSession,
  verifyPassword,
  type SessionUser,
} from '~/lib/auth';
import { logAudit } from '~/lib/db';

export const prerender = false;

const body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  await seedDemoUsersIfNeeded(env.DB);

  const row = await findUserByEmail(env.DB, parsed.data.email);
  if (!row || !(await verifyPassword(parsed.data.password, row.password_hash))) {
    return Response.json({ error: 'No account matches that email and password.' }, { status: 401 });
  }

  const user: SessionUser = { id: row.id, email: row.email, name: row.name, role: row.role };
  const token = await signSession(env, user);
  const cookie = buildCookie(token, env.ENV !== 'dev');
  await logAudit(env.DB, { actor: `user:${row.id}`, action: 'login' });

  return Response.json(
    { user },
    {
      status: 200,
      headers: { 'set-cookie': cookie },
    },
  );
};
