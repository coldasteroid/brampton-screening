import Link from 'next/link';
import LanguagePicker from '~/components/LanguagePicker';
import { t, type Lang } from '~/lib/i18n';
import type { SessionUser } from '~/lib/auth';

interface Props {
  user: SessionUser | null;
  lang: Lang;
  pathname: string;
}

export default function Nav({ user, lang, pathname }: Props) {
  const initials =
    user?.name
      .split(' ')
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '';

  const isCurrent = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="border-b border-line/60 bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-fair">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M5 7h6v2.5H7.5V12H11v2.5H5z" fill="currentColor" />
              <circle cx="17" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="m15.2 12 1.2 1.2 2.6-2.6"
                stroke="#FAFAF7"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold tracking-tight">FairPlan</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-ink-subtle">
              for Brampton APS
            </span>
          </span>
        </Link>
        <nav
          className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex"
          aria-label="Primary"
        >
          <Link
            href="/"
            aria-current={isCurrent('/') ? 'page' : undefined}
            className="hover:text-ink transition-colors"
          >
            {t(lang, 'nav.portal')}
          </Link>
          {user?.role === 'resident' && (
            <Link
              href="/my-notices"
              aria-current={isCurrent('/my-notices') ? 'page' : undefined}
              className="text-fair-dark hover:text-ink transition-colors"
            >
              {t(lang, 'nav.my_notices')}
            </Link>
          )}
          <Link
            href="/dashboard"
            aria-current={isCurrent('/dashboard') ? 'page' : undefined}
            className="hover:text-ink transition-colors"
          >
            {t(lang, 'nav.dashboard')}
          </Link>
          <Link
            href="/bylaws"
            aria-current={isCurrent('/bylaws') ? 'page' : undefined}
            className="hover:text-ink transition-colors"
          >
            Bylaws
          </Link>
          {(user?.role === 'officer' || user?.role === 'manager') && (
            <>
              <Link
                href="/officer"
                aria-current={isCurrent('/officer') ? 'page' : undefined}
                className="text-fair-dark hover:text-ink transition-colors"
              >
                Screening queue
              </Link>
              <Link
                href="/hearings"
                aria-current={isCurrent('/hearings') ? 'page' : undefined}
                className="text-fair-dark hover:text-ink transition-colors"
              >
                Hearings
              </Link>
            </>
          )}
          {user?.role === 'manager' && (
            <Link
              href="/manager"
              aria-current={isCurrent('/manager') ? 'page' : undefined}
              className="text-fair-dark hover:text-ink transition-colors"
            >
              Manager
            </Link>
          )}
          <Link
            href="/about"
            aria-current={isCurrent('/about') ? 'page' : undefined}
            className="hover:text-ink transition-colors"
          >
            {t(lang, 'nav.about')}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguagePicker current={lang} />
          <Link href="/" className="hidden btn-ghost text-sm border border-line md:inline-flex">
            {t(lang, 'nav.check_ticket')}
          </Link>
          {user ? (
            <>
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium leading-tight text-ink">{user.name}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-subtle">{user.role}</p>
              </div>
              <span
                className="grid h-9 w-9 place-items-center rounded-full bg-fair/15 text-xs font-semibold text-fair-dark"
                aria-hidden="true"
              >
                {initials}
              </span>
              <form method="POST" action="/api/auth/logout" className="contents">
                <button type="submit" className="btn-ghost text-sm border border-line">
                  {t(lang, 'nav.sign_out')}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-ink-soft hover:text-ink md:inline"
              >
                {t(lang, 'nav.sign_in')}
              </Link>
              <Link href="/signup" className="btn-primary text-sm">
                {t(lang, 'nav.create_account')}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 12h14m-5-5 5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
