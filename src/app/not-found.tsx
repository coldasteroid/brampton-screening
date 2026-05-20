// Next renders this for unmatched routes AND when a server action / page calls
// notFound(). It cannot accept the `?id=` query param (built-in route doesn't
// receive props), so the lookup helper falls back to the generic copy. Pages
// that need to show the user which id was missing redirect to /not-found.
import TicketLookup from '~/components/TicketLookup';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-fair-dark">404 · Not found</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
        We couldn&apos;t find that notice.
      </h1>
      <p className="mt-4 text-ink-soft">Try entering the notice number again.</p>
      <div className="mx-auto mt-10 max-w-md text-left">
        <TicketLookup variant="inline" />
      </div>
    </section>
  );
}
