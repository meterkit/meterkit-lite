import { describe, it, expect } from 'vitest';
import { spendDelta } from '../../src/ui/kpiDelta';

const bucket = (spendCents: number) => ({ t: new Date('2026-07-01T00:00:00Z'), tokens: 0, spendCents });

describe('spendDelta', () => {
  it('compares the latest half of the series against the previous half', () => {
    // prev half = 100+100=200, current half = 150+150=300 → +50%
    const d = spendDelta([bucket(100), bucket(100), bucket(150), bucket(150)]);
    expect(d).toEqual({ pct: 50, windowDays: 2 });
  });

  it('returns a negative pct when spend fell', () => {
    const d = spendDelta([bucket(200), bucket(200), bucket(100), bucket(100)]);
    expect(d).toEqual({ pct: -50, windowDays: 2 });
  });

  it('uses only the trailing 2× half when the series is odd-length', () => {
    // half=2 → prev=[100,100], curr=[300,100]; leading 999 ignored
    const d = spendDelta([bucket(999), bucket(100), bucket(100), bucket(300), bucket(100)]);
    expect(d).toEqual({ pct: 100, windowDays: 2 });
  });

  it('returns null when there is no previous window to compare (short series)', () => {
    expect(spendDelta([])).toBeNull();
    expect(spendDelta([bucket(10)])).toBeNull();
    expect(spendDelta([bucket(10), bucket(20)])).toBeNull(); // half=1 < 2 → too noisy
  });

  it('returns null when previous-window spend is zero (no fake percentages)', () => {
    expect(spendDelta([bucket(0), bucket(0), bucket(10), bucket(10)])).toBeNull();
  });
});
