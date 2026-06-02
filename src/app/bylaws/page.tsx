import type { Metadata } from 'next';
import BylawSearch from '~/components/BylawSearch';
import { BYLAW_CORPUS } from '~/lib/rag/bylaws';

export const metadata: Metadata = { title: 'Bylaws · FairPlan' };

const CATEGORY_LABEL: Record<string, string> = {
  parking: 'Parking & Traffic',
  property: 'Property Standards',
  rental: 'Rental Licensing',
  safety: 'Safety',
  procedure: 'AMPS Procedure (Ontario)',
};

export default function BylawsPage() {
  const byCategory = BYLAW_CORPUS.reduce<Record<string, typeof BYLAW_CORPUS>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <>
      <section className="border-b border-line/60">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-10 py-12 md:py-16">
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl text-balance">
            Bylaws.
          </h1>
          <p className="mt-3 max-w-prose text-ink-soft">
            Search the property, parking, rental, and safety bylaws used to issue penalty notices.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 lg:px-10 py-12">
        <BylawSearch />
      </section>

      <section className="mx-auto max-w-[1200px] px-6 lg:px-10 pb-24">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          {BYLAW_CORPUS.length} sections · {Object.keys(byCategory).length} categories
        </h2>

        <div className="mt-8 space-y-10">
          {Object.entries(byCategory).map(([cat, chunks]) => (
            <section key={cat}>
              <h3 className="font-display text-lg font-semibold text-ink">
                {CATEGORY_LABEL[cat] ?? cat}
              </h3>
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {chunks.map((c) => (
                  <li key={c.id ?? `${c.bylaw}-${c.section}`} className="card p-5">
                    <p className="font-mono text-xs text-ink-subtle">
                      {c.bylaw} · {c.section}
                    </p>
                    <p className="mt-1 font-medium text-ink">{c.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
