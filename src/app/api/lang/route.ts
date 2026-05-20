import { isLang, LANG_COOKIE } from '~/lib/i18n';
import { env } from '~/lib/runtime';

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = String(form.get('lang') ?? '');
  if (!isLang(lang)) return new Response('bad lang', { status: 400 });

  const referer = request.headers.get('referer') ?? '/';
  const prod = env().ENV !== 'dev';
  const cookieAttrs = [
    `${LANG_COOKIE}=${lang}`,
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${60 * 60 * 24 * 365}`,
  ];
  if (prod) cookieAttrs.push('Secure');

  return new Response(null, {
    status: 303,
    headers: { location: referer, 'set-cookie': cookieAttrs.join('; ') },
  });
}
