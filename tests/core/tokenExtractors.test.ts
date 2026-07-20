import { describe, it, expect } from 'vitest';
import { openaiExtractor, anthropicExtractor, openaiEmbeddingExtractor } from '../../src/core/tokenExtractors';

describe('tokenExtractors', () => {
  it('reads OpenAI usage with no cache (cachedIn defaults to 0)', () => {
    expect(openaiExtractor({ usage: { prompt_tokens: 12, completion_tokens: 8 } })).toEqual({ in: 12, out: 8, cachedIn: 0 });
  });
  it('subtracts OpenAI cached_tokens from prompt_tokens (cached is a subset)', () => {
    expect(
      openaiExtractor({ usage: { prompt_tokens: 100, completion_tokens: 8, prompt_tokens_details: { cached_tokens: 30 } } }),
    ).toEqual({ in: 70, out: 8, cachedIn: 30 });
  });
  it('floors OpenAI in at 0 when cached_tokens exceeds prompt_tokens (never trust provider)', () => {
    expect(
      openaiExtractor({ usage: { prompt_tokens: 10, completion_tokens: 3, prompt_tokens_details: { cached_tokens: 50 } } }),
    ).toEqual({ in: 0, out: 3, cachedIn: 50 });
  });
  it('reads Anthropic usage with no cache (cache fields default to 0)', () => {
    expect(anthropicExtractor({ usage: { input_tokens: 5, output_tokens: 9 } })).toEqual({ in: 5, out: 9, cachedIn: 0, cacheWriteIn: 0 });
  });
  it('maps Anthropic cache_read/cache_creation as separate fields (not subtracted)', () => {
    expect(
      anthropicExtractor({ usage: { input_tokens: 5, output_tokens: 9, cache_read_input_tokens: 40, cache_creation_input_tokens: 12 } }),
    ).toEqual({ in: 5, out: 9, cachedIn: 40, cacheWriteIn: 12 });
  });
  it('reads an embedding usage as input-only (out: 0)', () => {
    expect(openaiEmbeddingExtractor({ usage: { prompt_tokens: 20 } })).toEqual({ in: 20, out: 0 });
  });
  it('throws on a malformed always-present field', () => {
    expect(() => openaiExtractor({})).toThrow();
    expect(() => openaiEmbeddingExtractor({})).toThrow();
  });
});
