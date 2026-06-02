'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguagePicker from '~/components/LanguagePicker';
import { t, type Lang } from '~/lib/i18n';
import type { SessionUser } from '~/lib/auth';

interface Props {
  user: SessionUser | null;
  lang: Lang;
}

export default function Nav({ user, lang }: Props) {
  const pathname = usePathname() ?? '/';
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
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 py-3 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-fair">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
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
            <span className="font-display text-base font-semibold tracking-tight whitespace-nowrap">
              FairPlan
            </span>
            <span className="whitespace-nowrap text-[9px] uppercase tracking-[0.18em] text-ink-subtle">
              for Brampton APS
            </span>
          </span>
        </Link>
        <nav
          className="hidden items-center gap-5 text-[13px] font-medium text-ink-soft md:flex"
          aria-label="Primary"
        >
          <Link
            href="/"
            aria-current={isCurrent('/') ? 'page' : undefined}
            className="whitespace-nowrap hover:text-ink transition-colors"
          >
            {t(lang, 'nav.portal')}
          </Link>
          {user?.role === 'resident' && (
            <Link
              href="/my-notices"
              aria-current={isCurrent('/my-notices') ? 'page' : undefined}
              className="whitespace-nowrap text-fair-dark hover:text-ink transition-colors"
            >
              {t(lang, 'nav.my_notices')}
            </Link>
          )}
          <Link
            href="/bylaws"
            aria-current={isCurrent('/bylaws') ? 'page' : undefined}
            className="whitespace-nowrap hover:text-ink transition-colors"
          >
            Bylaws
          </Link>
          {(user?.role === 'officer' || user?.role === 'manager') && (
            <span
              className="inline-flex items-center gap-4 border-l border-line pl-4 text-fair-dark"
              aria-label="Staff tools"
            >
              <Link
                href="/officer"
                aria-current={isCurrent('/officer') ? 'page' : undefined}
                className="whitespace-nowrap hover:text-ink transition-colors"
              >
                Queue
              </Link>
              <Link
                href="/hearings"
                aria-current={isCurrent('/hearings') ? 'page' : undefined}
                className="whitespace-nowrap hover:text-ink transition-colors"
              >
                Hearings
              </Link>
              {user?.role === 'manager' && (
                <>
                  <Link
                    href="/manager"
                    aria-current={isCurrent('/manager') ? 'page' : undefined}
                    className="whitespace-nowrap hover:text-ink transition-colors"
                  >
                    Manager
                  </Link>
                  <Link
                    href="/dashboard"
                    aria-current={isCurrent('/dashboard') ? 'page' : undefined}
                    className="whitespace-nowrap hover:text-ink transition-colors"
                  >
                    {t(lang, 'nav.dashboard')}
                  </Link>
                </>
              )}
            </span>
          )}
          <Link
            href="/about"
            aria-current={isCurrent('/about') ? 'page' : undefined}
            className={
              'whitespace-nowrap hover:text-ink transition-colors' +
              (user?.role === 'officer' || user?.role === 'manager'
                ? ' border-l border-line pl-4'
                : '')
            }
          >
            {t(lang, 'nav.about')}
          </Link>
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <LanguagePicker current={lang} />
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden text-right leading-tight md:block">
                <p className="whitespace-nowrap text-[13px] font-medium text-ink">{user.name}</p>
                <p className="whitespace-nowrap text-[9px] uppercase tracking-[0.16em] text-ink-subtle">
                  {user.role}
                </p>
              </div>
              <span
                className="grid h-8 w-8 place-items-center rounded-full bg-fair/15 text-xs font-semibold text-fair-dark"
                aria-hidden="true"
              >
                {initials}
              </span>
              <form method="POST" action="/api/auth/logout" className="contents">
                <button
                  type="submit"
                  className="rounded-full p-1.5 text-ink-subtle hover:bg-line/40 hover:text-ink transition-colors"
                  title={t(lang, 'nav.sign_out')}
                  aria-label={t(lang, 'nav.sign_out')}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M15 17l5-5-5-5M20 12H9M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden whitespace-nowrap text-[13px] font-medium text-ink-soft hover:text-ink md:inline"
              >
                {t(lang, 'nav.sign_in')}
              </Link>
              <Link href="/signup" className="btn-primary text-[13px] whitespace-nowrap">
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
