import { clearCookie } from '~/lib/auth';
import { env } from '~/lib/runtime';

export function POST(request: Request) {
  const prod = env().ENV !== 'dev';
  const accept = request.headers.get('accept') ?? '';
  const wantsHtml = accept.includes('text/html');

  const headers = new Headers({ 'set-cookie': clearCookie(prod) });

  if (wantsHtml) {
    headers.set('location', '/');
    return new Response(null, { status: 303, headers });
  }
  return new Response(null, { status: 204, headers });
}
