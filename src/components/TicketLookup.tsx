import { useState } from 'react';

const SAMPLES = [
  { id: 'BRP-2026-001003', hint: '$750 property maintenance · ward 9' },
  { id: 'BRP-2026-001004', hint: '$1,000 pool fence · ward 6' },
  { id: 'BRP-2026-001006', hint: '$1,500 rental unlicensed · ward 9' },
];

interface Props {
  variant?: 'hero' | 'inline';
}

export default function TicketLookup({ variant = 'hero' }: Props) {
  const [value, setValue] = useState('');

  function go(id: string) {
    const cleaned = id.trim().toUpperCase();
    if (!cleaned) return;
    window.location.href = `/ticket/${encodeURIComponent(cleaned)}`;
  }

  function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    go(value);
  }

  const isHero = variant === 'hero';

  return (
    <div className={isHero ? 'w-full max-w-xl' : 'w-full'}>
      <form
        onSubmit={submit}
        className="flex flex-col gap-2 rounded-2xl border border-line bg-surface-raised p-2 shadow-card sm:flex-row sm:items-center sm:p-2"
        aria-describedby="ticket-lookup-help"
      >
        <label htmlFor="ticket-id" className="sr-only">
          Penalty notice number
        </label>
        <input
          id="ticket-id"
          name="ticket-id"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="BRP-2026-001003"
          autoComplete="off"
          inputMode="text"
          spellCheck={false}
          className="input border-0 bg-transparent px-4 py-3 text-base placeholder:text-ink-subtle focus:bg-transparent sm:flex-1"
        />
        <button type="submit" className="btn-primary justify-center px-5 py-3 text-sm">
          Find my notice
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12h14m-5-5 5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
      <p id="ticket-lookup-help" className="mt-2 px-1 text-xs text-ink-subtle">
        Or jump straight to a seeded demo notice:{' '}
        {SAMPLES.map((s, i) => (
          <span key={s.id}>
            {i > 0 && ' · '}
            <button
              type="button"
              onClick={() => go(s.id)}
              className="font-mono text-ink underline underline-offset-4 hover:text-fair-dark"
              aria-label={`Open sample notice ${s.id} (${s.hint})`}
            >
              {s.id}
            </button>
          </span>
        ))}
      </p>
    </div>
  );
}
