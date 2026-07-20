import type { TokenExtractor, TokenUsage } from './tokenExtractors';
import { priceCents, resolvePricing } from './modelPricing';
import type { PricingOverride } from './modelPricing';
import type { UsageRepo } from '../store/usageRepo';
import { normalizeLabels } from '../store/labels';

// One-shot warn per unknown model so a repeated unknown model logs once, not
// once per request.
const warnedModels = new Set<string>();
const warnUnknownModel = (model: string): void => {
  if (warnedModels.has(model)) return;
  warnedModels.add(model);
  console.warn(`[meterkit] unknown model "${model}" — recording usage at cost 0; add it via the pricing override to price it.`);
};

type MeterArgs<T> = {
  userId: string; model: string; repo: UsageRepo; extract: TokenExtractor; call: () => Promise<T>;
  pricing?: PricingOverride; orgId?: string; labels?: Record<string, string>;
};

/** Like withMeter, but also returns the extracted usage and the priced cost so
 *  callers (withAiGuard) don't have to re-extract or re-price the same result.
 *  `costCents` is null for unpriced (unknown) models. */
export const withMeterDetailed = async <T>(args: MeterArgs<T>): Promise<{ result: T; usage: TokenUsage; costCents: number | null }> => {
  const result = await args.call();
  const usage = args.extract(result); // throws if malformed -> nothing recorded
  // Price BEFORE record so an unknown model can no longer drop the whole event.
  const cents = priceCents(args.model, usage, resolvePricing(args.pricing));
  if (cents === null) warnUnknownModel(args.model);
  try {
    await args.repo.record({
      userId: args.userId,
      orgId: args.orgId,
      model: args.model,
      tokensIn: usage.in,
      tokensOut: usage.out,
      cachedIn: usage.cachedIn ?? 0,
      cacheWriteIn: usage.cacheWriteIn ?? 0,
      costCents: cents ?? 0,
      labels: normalizeLabels(args.labels),
      at: new Date(),
    });
  } catch (err) {
    // Best-effort metering: a usage-store write failure must not lose an
    // already-produced (already-paid) result. The quota pre-check + spend cap
    // are the safety net; under-counting on write failure is preferable to
    // discarding the caller's paid result.
    console.error('[meterkit] usage record failed (non-blocking):', err);
  }
  return { result, usage, costCents: cents };
};

export const withMeter = async <T>(args: MeterArgs<T>): Promise<T> =>
  (await withMeterDetailed(args)).result;
