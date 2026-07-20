import type { TokenUsage } from './tokenExtractors';

// Fallback cache multipliers, applied only when a model entry omits its own
// cache rate. Cache reads are cheaper than fresh input; cache creation costs a
// surcharge over fresh input.
const DEFAULT_CACHED_READ_MULT = 0.5;
const DEFAULT_CACHE_WRITE_MULT = 1.25;

// cents per 1,000,000 tokens
export type ModelRate = { in: number; out: number; cachedIn?: number; cacheWriteIn?: number };
export type PricingOverride = Record<string, ModelRate>;

export const DEFAULT_PRICING: Record<string, ModelRate> = {
  'gpt-4o-mini': { in: 15, out: 60, cachedIn: 8 },
  'gpt-4o': { in: 250, out: 1000, cachedIn: 125 },
  'claude-haiku-4-5': { in: 80, out: 400, cachedIn: 8, cacheWriteIn: 100 },
  'text-embedding-3-small': { in: 2, out: 0 },
  'text-embedding-3-large': { in: 13, out: 0 },
};

// Merge a buyer's override on top of the defaults (override wins per model).
export const resolvePricing = (override?: PricingOverride): Record<string, ModelRate> =>
  override ? { ...DEFAULT_PRICING, ...override } : DEFAULT_PRICING;

export const priceCents = (
  model: string,
  usage: TokenUsage,
  table: Record<string, ModelRate> = DEFAULT_PRICING,
): number | null => {
  const r = table[model];
  if (!r) return null; // unknown model → caller records 0 + warns; never throws
  const cachedIn = usage.cachedIn ?? 0;
  const cacheWriteIn = usage.cacheWriteIn ?? 0;
  const cachedRate = r.cachedIn ?? r.in * DEFAULT_CACHED_READ_MULT;
  const writeRate = r.cacheWriteIn ?? r.in * DEFAULT_CACHE_WRITE_MULT;
  return Math.ceil(
    (usage.in * r.in + cachedIn * cachedRate + cacheWriteIn * writeRate + usage.out * r.out) / 1_000_000,
  );
};

// Blended per-1M rate used to rank models for auto-degrade. null = unpriced.
export const blendedRate = (
  model: string,
  table: Record<string, ModelRate> = DEFAULT_PRICING,
): number | null => {
  const r = table[model];
  return r ? r.in + r.out : null;
};

// Cheapest priced candidate by blended rate; lexicographic tie-break.
export const cheapestOf = (
  candidates: string[],
  table: Record<string, ModelRate> = DEFAULT_PRICING,
): string | null => {
  let best: string | null = null;
  let bestRate = Infinity;
  for (const model of candidates) {
    const rate = blendedRate(model, table);
    if (rate === null) continue;
    if (rate < bestRate || (rate === bestRate && best !== null && model < best)) {
      best = model;
      bestRate = rate;
    }
  }
  return best;
};
