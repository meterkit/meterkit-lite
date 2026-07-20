import { describe, it, expect } from 'vitest';
import { billableTokens } from '../../src/core/billableTokens';

describe('billableTokens', () => {
  it('sums in + out when no cache tokens', () => {
    expect(billableTokens({ in: 100, out: 50 })).toBe(150);
  });
  it('adds cachedIn', () => {
    expect(billableTokens({ in: 100, out: 50, cachedIn: 30 })).toBe(180);
  });
  it('adds cacheWriteIn', () => {
    expect(billableTokens({ in: 100, out: 50, cacheWriteIn: 20 })).toBe(170);
  });
  it('adds all four token classes', () => {
    expect(billableTokens({ in: 100, out: 50, cachedIn: 30, cacheWriteIn: 20 })).toBe(200);
  });
  it('treats undefined cache fields as 0', () => {
    expect(billableTokens({ in: 10, out: 5, cachedIn: undefined, cacheWriteIn: undefined })).toBe(15);
  });
});
