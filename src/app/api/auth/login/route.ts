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
import { env } from '~/lib/runtime';

const body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const e = env();
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  await seedDemoUsersIfNeeded(e.DB);

  const row = await findUserByEmail(e.DB, parsed.data.email);
  if (!row || !(await verifyPassword(parsed.data.password, row.password_hash))) {
    return Response.json({ error: 'No account matches that email and password.' }, { status: 401 });
  }

  const user: SessionUser = { id: row.id, email: row.email, name: row.name, role: row.role };
  const token = await signSession(e, user);
  const cookie = buildCookie(token, e.ENV !== 'dev');
  await logAudit(e.DB, { actor: `user:${row.id}`, action: 'login' });

  return Response.json({ user }, { status: 200, headers: { 'set-cookie': cookie } });
}
