// meterkit-lite public API. Lite-native, hand-written (NOT script-generated).
// Enforcement (withAiGuard, quotas, credits, budgets, Stripe, tenancy) is Pro.

// metering core
export { withMeter } from './core/meter';
export { currentPeriodStart } from './core/period';

// extractors
export { openaiExtractor, anthropicExtractor, openaiEmbeddingExtractor } from './core/tokenExtractors';
export type { TokenExtractor, TokenUsage } from './core/tokenExtractors';

// billable + pricing
export { billableTokens } from './core/billableTokens';
export { priceCents, resolvePricing, DEFAULT_PRICING, blendedRate, cheapestOf } from './core/modelPricing';
export type { ModelRate, PricingOverride } from './core/modelPricing';

// usage types + store
export type { Usage } from './core/usage';
export type {
  UsageEvent, UserUsage, UsageBucket, BreakdownRow, BreakdownBy,
  BreakdownFilter, SpendFilter, UsageRepo,
} from './store/usageRepo';
export { createMemoryRepo } from './store/memoryRepo';
export { normalizeLabels, MAX_LABEL_KEYS, MAX_LABEL_KEY_LEN, MAX_LABEL_VALUE_LEN } from './store/labels';

// UI
export { LiteDashboard } from './ui/LiteDashboard';
export type { LiteDashboardData } from './ui/sampleLiteData';
export { sampleLiteData } from './ui/sampleLiteData';
export { LineArea } from './ui/charts/LineArea';
export { Bars } from './ui/charts/Bars';
export { Sparkline } from './ui/charts/Sparkline';
