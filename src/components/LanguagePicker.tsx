'use client';

import { LANGUAGES, type Lang } from '~/lib/i18n';

interface Props {
  current: Lang;
}

export default function LanguagePicker({ current }: Props) {
  const codes = Object.keys(LANGUAGES) as Lang[];
  return (
    <form method="POST" action="/api/lang" className="relative">
      <label htmlFor="lang-picker" className="sr-only">
        Language
      </label>
      <select
        id="lang-picker"
        name="lang"
        defaultValue={current}
        onChange={(e) => (e.currentTarget.form as HTMLFormElement).submit()}
        className="cursor-pointer appearance-none rounded-lg border border-line bg-surface-raised py-1.5 pl-3 pr-8 text-sm font-medium text-ink hover:border-ink/40 focus:border-fair focus:outline-none"
      >
        {codes.map((code) => (
          <option key={code} value={code}>
            {LANGUAGES[code].native}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="m6 9 6 6 6-6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </form>
  );
}
