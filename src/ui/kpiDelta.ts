import type { UsageBucket } from '../store/usageRepo';

export type SpendDelta = { pct: number; windowDays: number };

/** Spend change of the latest half of the series vs the half before it.
 *  Null when there is no meaningful previous window (spec: no fake numbers). */
export const spendDelta = (series: UsageBucket[]): SpendDelta | null => {
  const half = Math.floor(series.length / 2);
  if (half < 2) return null;
  const sum = (rows: UsageBucket[]) => rows.reduce((acc, b) => acc + b.spendCents, 0);
  const prev = sum(series.slice(series.length - 2 * half, series.length - half));
  if (prev <= 0) return null;
  const curr = sum(series.slice(series.length - half));
  return { pct: Math.round(((curr - prev) / prev) * 100), windowDays: half };
};
