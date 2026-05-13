/**
 * Hearing slot offering. Deterministically generates 3 upcoming weekday slots
 * starting 10 business days out, at 10:00, 13:00, 15:30 Eastern. This is the
 * MVP — production swaps this for a real availability service.
 */

export interface HearingSlot {
  id: string;
  startsAt: Date;
  durationMinutes: number;
}

const SLOT_TIMES = [
  { hour: 10, minute: 0 },
  { hour: 13, minute: 0 },
  { hour: 15, minute: 30 },
];

export function offerSlots(reviewId: string, now = new Date()): HearingSlot[] {
  const start = new Date(now);
  start.setDate(start.getDate() + 10);
  while (start.getDay() === 0 || start.getDay() === 6) start.setDate(start.getDate() + 1);

  const slots: HearingSlot[] = [];
  for (let i = 0; i < SLOT_TIMES.length; i++) {
    const t = SLOT_TIMES[i];
    const at = new Date(start);
    at.setHours(t.hour, t.minute, 0, 0);
    slots.push({
      id: `slot_${reviewId}_${i}`,
      startsAt: at,
      durationMinutes: 30,
    });
  }
  return slots;
}

export function formatSlot(s: HearingSlot): { date: string; time: string } {
  return {
    date: s.startsAt.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    time: s.startsAt.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' }),
  };
}

export function renderIcs(args: {
  uid: string;
  startsAt: Date;
  durationMinutes: number;
  summary: string;
  description: string;
  location?: string;
}): string {
  const end = new Date(args.startsAt.getTime() + args.durationMinutes * 60_000);
  const dt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const now = dt(new Date());
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FairPlan//Brampton APS//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${args.uid}@fairplan`,
    `DTSTAMP:${now}`,
    `DTSTART:${dt(args.startsAt)}`,
    `DTEND:${dt(end)}`,
    `SUMMARY:${escapeIcs(args.summary)}`,
    `DESCRIPTION:${escapeIcs(args.description)}`,
    args.location ? `LOCATION:${escapeIcs(args.location)}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}
