import { defineMiddleware } from 'astro:middleware';
import { readCookie, verifySession } from '~/lib/auth';
import { readLangFromCookie } from '~/lib/i18n';

export const onRequest = defineMiddleware(async (context, next) => {
  const env = context.locals.runtime.env;
  const token = readCookie(context.request);
  context.locals.user = await verifySession(env, token);
  context.locals.lang = readLangFromCookie(context.request.headers);
  return next();
});
