import { useState } from 'react';
import type { BylawChunk } from '~/lib/rag/bylaws';

interface Hit extends BylawChunk {
  score: number;
}

const SAMPLE_QUERIES = [
  'My pool fence is missing a self-latching gate',
  'Snow plough blocked by parked car',
  'I think I was wrongly charged for the rental licence',
  'Hardship — single parent, can\'t pay full amount',
];

export default function BylawSearch() {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  async function run(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    setQ(trimmed);
    setLoading(true);
    try {
      const res = await fetch(`/api/rag/search?q=${encodeURIComponent(trimmed)}&k=4`);
      const j = (await res.json()) as { hits: Hit[] };
      setHits(j.hits);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
        className="flex flex-col gap-2 rounded-2xl border border-line bg-surface-raised p-2 shadow-card sm:flex-row sm:items-center"
      >
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Describe the situation in your own words"
          className="input border-0 bg-transparent px-4 py-3 sm:flex-1"
          aria-label="Bylaw search query"
        />
        <button type="submit" disabled={loading} className="btn-primary text-sm disabled:opacity-60">
          {loading ? 'Searching…' : 'Find relevant bylaws'}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SAMPLE_QUERIES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => run(s)}
            className="pill border border-line bg-surface-raised text-ink-soft transition hover:border-ink/40 hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>

      {hits.length > 0 && (
        <ol className="space-y-3">
          {hits.map((h) => (
            <li key={h.id} className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-sunken px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ink-subtle">{h.bylaw} · {h.section}</p>
                  <p className="mt-0.5 truncate font-medium text-ink">{h.title}</p>
                </div>
                <span className="pill bg-fair/15 text-xs text-fair-dark shrink-0">
                  match {(h.score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="px-5 py-4 text-sm leading-relaxed text-ink-soft">{h.body}</p>
            </li>
          ))}
        </ol>
      )}

      {q && hits.length === 0 && !loading && (
        <p className="text-sm text-ink-subtle">
          No matches for <span className="font-mono">{q}</span>. Try one of the sample queries above.
        </p>
      )}
    </div>
  );
}
