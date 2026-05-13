import { describe, expect, test } from 'vitest';
import { hardshipBand, limatThresholdFor } from '~/lib/data/statcan';

describe('statcan · LIM-AT calibration', () => {
  test('LIM-AT scales with sqrt(household)', () => {
    const one = limatThresholdFor(1);
    const four = limatThresholdFor(4);
    expect(four).toBeGreaterThan(one);
    // four-person threshold is roughly 2× single-person (sqrt(4) = 2)
    expect(four / one).toBeCloseTo(2, 0);
  });

  test('income well below threshold → severe band', () => {
    const { band, ratio } = hardshipBand(15_000, 4);
    expect(band).toBe('severe');
    expect(ratio).toBeLessThan(0.8);
  });

  test('income near threshold → moderate band', () => {
    const limat = limatThresholdFor(3);
    const { band } = hardshipBand(limat, 3);
    expect(band).toBe('moderate');
  });

  test('income well above threshold → standard band', () => {
    const { band } = hardshipBand(150_000, 2);
    expect(band).toBe('standard');
  });
});
