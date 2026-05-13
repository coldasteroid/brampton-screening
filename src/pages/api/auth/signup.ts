import type { APIRoute } from 'astro';
import { z } from 'zod';
import { buildCookie, createUser, signSession } from '~/lib/auth';

export const prerender = false;

const body = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  password: z.string().min(8).max(200),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const msg = parsed.error.issues.find((i) => i.path[0] === 'password')
      ? 'Password must be at least 8 characters.'
      : 'Please fill in name, email, and password.';
    return Response.json({ error: msg }, { status: 400 });
  }

  try {
    const user = await createUser(env.DB, parsed.data);
    const token = await signSession(env, user);
    const cookie = buildCookie(token, env.ENV !== 'dev');
    return Response.json(
      { user },
      { status: 201, headers: { 'set-cookie': cookie } },
    );
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 409 });
  }
};
