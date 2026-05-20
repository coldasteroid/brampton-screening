import { z } from 'zod';
import { buildCookie, createUser, signSession } from '~/lib/auth';
import { env } from '~/lib/runtime';

const body = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const e = env();
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const msg = parsed.error.issues.find((i) => i.path[0] === 'password')
      ? 'Password must be at least 8 characters.'
      : 'Please fill in name, email, and password.';
    return Response.json({ error: msg }, { status: 400 });
  }

  try {
    const user = await createUser(e.DB, parsed.data);
    const token = await signSession(e, user);
    const cookie = buildCookie(token, e.ENV !== 'dev');
    return Response.json({ user }, { status: 201, headers: { 'set-cookie': cookie } });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 409 });
  }
}
