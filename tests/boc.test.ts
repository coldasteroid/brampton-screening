import { describe, expect, test } from 'vitest';
import { creditCardInterestCost, getRateBundle } from '~/lib/data/boc';

describe('boc · credit-card interest cost', () => {
  test('zero APR → zero interest', () => {
    expect(creditCardInterestCost(1000, 0, 12)).toBe(0);
  });

  test('standard 21.99% APR over 12 months on $1000 is around $122', () => {
    const cost = creditCardInterestCost(1000, 21.99, 12);
    expect(cost).toBeGreaterThan(110);
    expect(cost).toBeLessThan(135);
  });

  test('shorter terms have less total interest', () => {
    const short = creditCardInterestCost(1000, 21.99, 3);
    const long = creditCardInterestCost(1000, 21.99, 12);
    expect(short).toBeLessThan(long);
  });
});

describe('boc · rate bundle', () => {
  test('falls back gracefully if upstream is unreachable', async () => {
    // Use a stub fetch that always fails to simulate a network outage.
    const stub = async () => {
      throw new Error('network down');
    };
    const bundle = await getRateBundle(stub as unknown as typeof fetch);
    expect(bundle.averageCreditCardAPR).toBe(21.99);
    expect(bundle.primeRate).toBeGreaterThan(0);
  });
});
