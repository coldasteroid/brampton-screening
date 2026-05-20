import { getHearing, getReview } from '~/lib/db';
import { renderIcs } from '~/lib/hearings';
import { env } from '~/lib/runtime';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const e = env();
  const hearing = id ? await getHearing(e.DB, id) : null;
  if (!hearing) return new Response('not found', { status: 404 });

  const review = await getReview(e.DB, hearing.review_id);
  const startsAt = new Date(hearing.scheduled_at);
  const ics = renderIcs({
    uid: hearing.id,
    startsAt,
    durationMinutes: hearing.duration_minutes,
    summary: `Brampton APS hearing · ${review?.ticket_id ?? hearing.id}`,
    description: `Administrative Penalty hearing for notice ${review?.ticket_id ?? '—'}. Heard by an independent Hearing Officer. Contact: 905-450-4770.`,
    location: 'Court Services, 5 Ray Lawson Blvd, Brampton, ON, L6Y 5L7',
  });

  return new Response(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="fairplan-hearing-${hearing.id}.ics"`,
      'cache-control': 'no-store',
    },
  });
}
