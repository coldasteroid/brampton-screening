import { describe, expect, test } from 'vitest';
import { offerSlots, renderIcs } from '~/lib/hearings';

describe('hearings · slot generation', () => {
  test('offers three slots starting at least 10 calendar days out', () => {
    const now = new Date('2026-05-13T12:00:00Z');
    const slots = offerSlots('rev_test', now);
    expect(slots).toHaveLength(3);
    const earliest = slots[0].startsAt.getTime();
    expect(earliest - now.getTime()).toBeGreaterThanOrEqual(10 * 86_400_000);
  });

  test('every slot lands on a weekday', () => {
    const now = new Date('2026-05-13T12:00:00Z');
    for (const slot of offerSlots('rev_test', now)) {
      expect([1, 2, 3, 4, 5]).toContain(slot.startsAt.getDay());
    }
  });
});

describe('hearings · ICS rendering', () => {
  test('produces a valid VCALENDAR with the right UID and DTSTART', () => {
    const ics = renderIcs({
      uid: 'hr_abc',
      startsAt: new Date('2026-06-01T14:00:00Z'),
      durationMinutes: 30,
      summary: 'Test hearing',
      description: 'Test description',
      location: '5 Ray Lawson Blvd, Brampton',
    });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('UID:hr_abc@fairplan');
    expect(ics).toContain('DTSTART:20260601T140000Z');
    expect(ics).toContain('SUMMARY:Test hearing');
    expect(ics).toContain('LOCATION:5 Ray Lawson Blvd\\, Brampton');
  });
});
