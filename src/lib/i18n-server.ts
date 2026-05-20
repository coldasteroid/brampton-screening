import { cookies } from 'next/headers';
import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from '~/lib/i18n';

// Replaces Astro middleware's `locals.lang`. Server-only helper that reads
// the language preference cookie set by /api/lang.
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const v = store.get(LANG_COOKIE)?.value;
  return isLang(v) ? v : DEFAULT_LANG;
}
