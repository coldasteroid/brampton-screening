import { useEffect, useState } from 'react';

interface Props {
  label: string;
  endpoint: string;
  format: 'currency' | 'percent' | 'number' | 'text';
  fallback: string;
  hint?: string;
}

export default function LiveStat({ label, endpoint, format, fallback, hint }: Props) {
  const [value, setValue] = useState<string>(fallback);
  const [isLive, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(endpoint, { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: any) => {
        if (cancelled || !j) return;
        const v = j.value;
        if (v == null) return;
        setLive(true);
        if (format === 'currency') setValue(`$${Number(v).toLocaleString('en-CA')}`);
        else if (format === 'percent') setValue(`${Number(v).toFixed(2)}%`);
        else if (format === 'number') setValue(Number(v).toLocaleString('en-CA'));
        else setValue(String(v));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [endpoint, format]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${isLive ? 'animate-pulse bg-fair' : 'bg-ink-subtle/40'}`}
          aria-hidden
        />
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink-subtle">{label}</span>
      </div>
      <p className="font-display text-3xl font-semibold leading-none tracking-tight text-ink">{value}</p>
      {hint && <p className="text-xs text-ink-subtle">{hint}</p>}
    </div>
  );
}
