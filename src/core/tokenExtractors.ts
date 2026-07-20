export type TokenUsage = { in: number; out: number; cachedIn?: number; cacheWriteIn?: number };
export type TokenExtractor = (raw: unknown) => TokenUsage;

const num = (v: unknown): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error('meterkit: missing/invalid token count');
  return v;
};

// Optional cache field: absent/null → 0; present → must be a finite number.
const optNum = (v: unknown): number => (v === undefined || v === null ? 0 : num(v));

export const openaiExtractor: TokenExtractor = (raw) => {
  const u = (raw as any)?.usage ?? {};
  // OpenAI's cached_tokens is a SUBSET of prompt_tokens — subtract it so `in`
  // is uncached input only and cachedIn is priced at the cache-read rate.
  const cachedIn = optNum(u.prompt_tokens_details?.cached_tokens);
  // Floor at 0: never trust the provider — a malformed response where
  // cached_tokens > prompt_tokens must not yield a negative token count/cost.
  return { in: Math.max(0, num(u.prompt_tokens) - cachedIn), out: num(u.completion_tokens), cachedIn };
};

export const anthropicExtractor: TokenExtractor = (raw) => {
  const u = (raw as any)?.usage ?? {};
  // Anthropic's cache fields are SEPARATE from input_tokens — pass them through.
  return {
    in: num(u.input_tokens),
    out: num(u.output_tokens),
    cachedIn: optNum(u.cache_read_input_tokens),
    cacheWriteIn: optNum(u.cache_creation_input_tokens),
  };
};

export const openaiEmbeddingExtractor: TokenExtractor = (raw) => {
  const u = (raw as any)?.usage ?? {};
  return { in: num(u.prompt_tokens), out: 0 };
};
