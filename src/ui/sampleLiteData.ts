import type { UsageBucket, BreakdownRow } from '../store/usageRepo';
import type { Usage } from '../core/usage';

export type LiteDashboardData = {
  total: Usage;
  series: UsageBucket[];
  byModel: BreakdownRow[];
};

const day = (n: number): Date => new Date(Date.UTC(2026, 6, n));

const series: UsageBucket[] = [
  { t: day(14), tokens: 182_400, spendCents: 214 },
  { t: day(15), tokens: 205_900, spendCents: 248 },
  { t: day(16), tokens: 168_300, spendCents: 191 },
  { t: day(17), tokens: 241_700, spendCents: 302 },
  { t: day(18), tokens: 220_100, spendCents: 276 },
  { t: day(19), tokens: 263_500, spendCents: 331 },
  { t: day(20), tokens: 298_200, spendCents: 388 },
];

const byModel: BreakdownRow[] = [
  { key: 'gpt-4o', tokens: 861_300, spendCents: 1_204 },
  { key: 'gpt-4o-mini', tokens: 742_800, spendCents: 446 },
  { key: 'text-embedding-3-small', tokens: 176_000, spendCents: 300 },
];

/** Sample data for the README screenshot and the mini-demo. Totals are the sum
 *  of the series so the dashboard numbers are internally consistent. */
export const sampleLiteData: LiteDashboardData = {
  total: {
    tokens: series.reduce((a, b) => a + b.tokens, 0),
    spendCents: series.reduce((a, b) => a + b.spendCents, 0),
  },
  series,
  byModel,
};
