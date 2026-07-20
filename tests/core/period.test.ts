import { describe, it, expect } from 'vitest';
import { currentPeriodStart } from '../../src/core/period';

describe('currentPeriodStart', () => {
  it('defaults to first of the calendar month (UTC)', () => {
    const now = new Date('2026-07-15T10:00:00.000Z');
    expect(currentPeriodStart(now).toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });

  it('returns the most recent monthly anniversary at or before now when given an anchor', () => {
    const anchor = new Date('2026-01-09T08:30:00.000Z');
    const now = new Date('2026-07-15T10:00:00.000Z');
    // last anniversary <= now is the 9th of July
    expect(currentPeriodStart(now, anchor).toISOString()).toBe('2026-07-09T08:30:00.000Z');
  });

  it('when now is before this month\'s anniversary, uses last month\'s anniversary', () => {
    const anchor = new Date('2026-01-20T00:00:00.000Z');
    const now = new Date('2026-07-15T10:00:00.000Z'); // 15th < 20th
    expect(currentPeriodStart(now, anchor).toISOString()).toBe('2026-06-20T00:00:00.000Z');
  });

  it('returns the anchor itself when now equals the anchor', () => {
    const anchor = new Date('2026-07-01T00:00:00.000Z');
    expect(currentPeriodStart(anchor, anchor).toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });

  it('clamps a month-end anchor to each month\'s length (Jan 31 -> Feb 28)', () => {
    const anchor = new Date('2026-01-31T00:00:00.000Z');
    const now = new Date('2026-03-15T00:00:00.000Z');
    // anniversaries: Jan31, Feb28 (<= now), Mar31 (> now) -> most recent is Feb 28
    expect(currentPeriodStart(now, anchor).toISOString()).toBe('2026-02-28T00:00:00.000Z');
  });
});
