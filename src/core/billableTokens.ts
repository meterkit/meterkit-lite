import type { TokenUsage } from './tokenExtractors';

/** Total throughput count (1:1) — every processed token counts once, cache
 *  tokens included. This is the single source of truth for what the token-quota
 *  and the Stripe metered quantity count. Euro-margin is protected separately by
 *  the spend-cap / budget engine, so the quota stays a pure "tokens processed" ceiling. */
export const billableTokens = (u: TokenUsage): number =>
  u.in + (u.cachedIn ?? 0) + (u.cacheWriteIn ?? 0) + u.out;
