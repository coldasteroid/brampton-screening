import type { APIRoute } from 'astro';
import { clearCookie } from '~/lib/auth';

export const prerender = false;

export const POST: APIRoute = ({ request, locals }) => {
  const prod = locals.runtime.env.ENV !== 'dev';
  const accept = request.headers.get('accept') ?? '';
  const wantsHtml = accept.includes('text/html');

  const headers = new Headers({ 'set-cookie': clearCookie(prod) });

  if (wantsHtml) {
    headers.set('location', '/');
    return new Response(null, { status: 303, headers });
  }
  return new Response(null, { status: 204, headers });
};
