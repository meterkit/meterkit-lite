import { describe, it, expect } from 'vitest';
import { priceCents, resolvePricing, DEFAULT_PRICING, blendedRate, cheapestOf } from '../../src/core/modelPricing';

describe('priceCents', () => {
  it('computes cost from in/out tokens (no cache → unchanged from v1)', () => {
    // gpt-4o-mini: 15c per 1M in, 60c per 1M out
    expect(priceCents('gpt-4o-mini', { in: 1_000_000, out: 1_000_000 })).toBe(75);
  });
  it('returns null for an unknown model (never throws)', () => {
    expect(priceCents('nope', { in: 1, out: 1 })).toBeNull();
  });
  it('prices cache reads below full input (gpt-4o-mini cachedIn: 8c/1M)', () => {
    // 1M uncached in (15c) + 1M cache-read (8c) = 23c
    expect(priceCents('gpt-4o-mini', { in: 1_000_000, out: 0, cachedIn: 1_000_000 })).toBe(23);
  });
  it('adds the cache-write surcharge (claude-haiku-4-5 cacheWriteIn: 100c/1M)', () => {
    // 1M cache-creation only = 100c
    expect(priceCents('claude-haiku-4-5', { in: 0, out: 0, cacheWriteIn: 1_000_000 })).toBe(100);
  });
  it('prices an embedding model on input only (out rate is 0)', () => {
    expect(priceCents('text-embedding-3-small', { in: 1_000_000, out: 0 })).toBe(2);
  });
  it('falls back to the multiplier when a model omits an explicit cache rate', () => {
    // gpt-4o has no cacheWriteIn → fallback = in * 1.25 = 250 * 1.25 = 312.5 c/1M
    // 1M cache-creation = ceil(312.5) = 313
    expect(priceCents('gpt-4o', { in: 0, out: 0, cacheWriteIn: 1_000_000 })).toBe(313);
  });
  it('applies an injected override that adds a new model', () => {
    const table = resolvePricing({ 'my-model': { in: 100, out: 200 } });
    expect(priceCents('my-model', { in: 1_000_000, out: 0 }, table)).toBe(100);
  });
  it('applies an injected override that overrides an existing rate', () => {
    const table = resolvePricing({ 'gpt-4o-mini': { in: 999, out: 0 } });
    expect(priceCents('gpt-4o-mini', { in: 1_000_000, out: 0 }, table)).toBe(999);
  });
  it('resolvePricing with no override returns DEFAULT_PRICING', () => {
    expect(resolvePricing()).toBe(DEFAULT_PRICING);
  });
});

describe('blendedRate', () => {
  it('sums in + out rate for a known model', () => {
    expect(blendedRate('gpt-4o-mini')).toBe(75); // 15 + 60
  });
  it('returns null for an unknown model', () => {
    expect(blendedRate('nope')).toBeNull();
  });
});

describe('cheapestOf', () => {
  it('picks the lowest blended-rate candidate', () => {
    expect(cheapestOf(['gpt-4o', 'gpt-4o-mini'])).toBe('gpt-4o-mini');
  });
  it('ignores unpriced candidates', () => {
    expect(cheapestOf(['nope', 'gpt-4o'])).toBe('gpt-4o');
  });
  it('returns null when no candidate is priced', () => {
    expect(cheapestOf(['nope', 'also-nope'])).toBeNull();
  });
  it('breaks ties lexicographically', () => {
    const table = { aaa: { in: 5, out: 5 }, bbb: { in: 5, out: 5 } };
    expect(cheapestOf(['bbb', 'aaa'], table)).toBe('aaa');
    expect(cheapestOf(['aaa', 'bbb'], table)).toBe('aaa');
  });
});
