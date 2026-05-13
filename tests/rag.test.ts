import { describe, expect, test } from 'vitest';
import { searchBylaws } from '~/lib/rag/bylaws';

describe('rag · token-overlap bylaw retrieval', () => {
  test('pool fence query returns the pool enclosure bylaw first', () => {
    const hits = searchBylaws('My pool fence is missing a self-latching gate');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].id).toBe('brampton-219-2018-s2');
  });

  test('fire hydrant query returns the hydrant bylaw', () => {
    const hits = searchBylaws('parked within three metres of a fire hydrant');
    expect(hits[0].id).toBe('brampton-93-93-s8');
  });

  test('financial hardship query returns the AMPS hardship provision', () => {
    const hits = searchBylaws('single parent cannot pay full amount hardship');
    expect(hits[0].bylaw).toMatch(/Ontario Regulation 333\/07/);
  });

  test('empty query returns no results', () => {
    expect(searchBylaws('')).toEqual([]);
  });

  test('scores are sorted descending', () => {
    const hits = searchBylaws('property maintenance ground cover yard');
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i - 1].score).toBeGreaterThanOrEqual(hits[i].score);
    }
  });
});
