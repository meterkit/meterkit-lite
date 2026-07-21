import type { UsageBucket, BreakdownRow } from '../store/usageRepo';
import type { Usage } from '../core/usage';

export type LiteDashboardData = {
  total: Usage;
  requests: number;
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

const totalTokens = series.reduce((a, b) => a + b.tokens, 0);
const totalSpendCents = series.reduce((a, b) => a + b.spendCents, 0);

/** Shares of the series totals — mirrors the Pro sample's approach so the
 *  KPI row and the by-model breakdown tell one coherent story instead of
 *  disconnected random numbers. Shares sum to 1 for both tokens and spend. */
const shareOf = (tokenShare: number, spendShare: number) => ({
  tokens: Math.round(totalTokens * tokenShare),
  spendCents: Math.round(totalSpendCents * spendShare),
});

const byModel: BreakdownRow[] = [
  { key: 'gpt-4o', ...shareOf(0.32, 0.5) },
  { key: 'claude-sonnet-5', ...shareOf(0.28, 0.3) },
  { key: 'gpt-4o-mini', ...shareOf(0.26, 0.14) },
  { key: 'claude-haiku-4-5', ...shareOf(0.14, 0.06) },
];

/** Sample data for the README screenshot and the mini-demo. Totals are the sum
 *  of the series so the dashboard numbers are internally consistent. */
export const sampleLiteData: LiteDashboardData = {
  total: { tokens: totalTokens, spendCents: totalSpendCents },
  requests: 4_216,
  series,
  byModel,
};
