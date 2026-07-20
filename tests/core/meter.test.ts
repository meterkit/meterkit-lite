import { describe, it, expect } from 'vitest';
import { withMeter } from '../../src/core/meter';
import { openaiExtractor } from '../../src/core/tokenExtractors';
import { createMemoryRepo } from '../../src/store/memoryRepo';

describe('withMeter', () => {
  it('records usage from the call result and returns it', async () => {
    const repo = createMemoryRepo();
    const result = await withMeter({
      userId: 'u1', model: 'gpt-4o-mini', repo, extract: openaiExtractor,
      call: async () => ({ text: 'hi', usage: { prompt_tokens: 1_000_000, completion_tokens: 1_000_000 } }),
    });
    expect(result.text).toBe('hi');
    const u = await repo.current('u1', new Date(0));
    expect(u.tokens).toBe(2_000_000);
    expect(u.spendCents).toBe(75);
  });
  it('propagates and records nothing on malformed usage', async () => {
    const repo = createMemoryRepo();
    await expect(withMeter({
      userId: 'u1', model: 'gpt-4o-mini', repo, extract: openaiExtractor,
      call: async () => ({ text: 'no usage' }),
    })).rejects.toThrow();
    const u = await repo.current('u1', new Date(0));
    expect(u.tokens).toBe(0);
  });
  it('still resolves with the call result when repo.record rejects (best-effort metering)', async () => {
    const repo = { record: async () => { throw new Error('db down'); }, current: async () => ({ tokens: 0, spendCents: 0 }), top: async () => [], series: async () => [], breakdown: async () => [], spendInRange: async () => 0, tokensByMember: async () => [], tokensByModel: async () => [], deleteOrgData: async () => {} };
    const result = await withMeter({
      userId: 'u1', model: 'gpt-4o-mini', repo, extract: openaiExtractor,
      call: async () => ({ text: 'hi', usage: { prompt_tokens: 10, completion_tokens: 5 } }),
    });
    expect(result.text).toBe('hi');
  });
  it('prices cache-read tokens into costCents (cheaper than full input)', async () => {
    const repo = createMemoryRepo();
    await withMeter({
      userId: 'u1', model: 'gpt-4o-mini', repo, extract: openaiExtractor,
      // 1M prompt of which 1M cached → in:0, cachedIn:1M → cost = 8c (cache-read rate)
      call: async () => ({ usage: { prompt_tokens: 1_000_000, completion_tokens: 0, prompt_tokens_details: { cached_tokens: 1_000_000 } } }),
    });
    const u = await repo.current('u1', new Date(0));
    expect(u.spendCents).toBe(8);
  });
  it('records the event at costCents 0 for an unknown model (never dropped)', async () => {
    const repo = createMemoryRepo();
    await withMeter({
      userId: 'u1', model: 'totally-unknown-model', repo, extract: openaiExtractor,
      call: async () => ({ usage: { prompt_tokens: 1000, completion_tokens: 500 } }),
    });
    const u = await repo.current('u1', new Date(0));
    expect(u.tokens).toBe(1500); // tokens still recorded
    expect(u.spendCents).toBe(0); // cost 0, not dropped
  });
  it('applies a pricing override', async () => {
    const repo = createMemoryRepo();
    await withMeter({
      userId: 'u1', model: 'custom-x', repo, extract: openaiExtractor,
      pricing: { 'custom-x': { in: 100, out: 0 } },
      call: async () => ({ usage: { prompt_tokens: 1_000_000, completion_tokens: 0 } }),
    });
    const u = await repo.current('u1', new Date(0));
    expect(u.spendCents).toBe(100);
  });
  it('stamps orgId and normalized labels on the recorded event', async () => {
    const repo = createMemoryRepo();
    await withMeter({
      userId: 'u1', orgId: 'o1', model: 'gpt-4o-mini', repo, extract: openaiExtractor,
      labels: { feature: 'chat', dropped: 42 as unknown as string },
      call: async () => ({ usage: { prompt_tokens: 10, completion_tokens: 5 } }),
    });
    const byOrg = await repo.breakdown(new Date(0), 'org');
    expect(byOrg).toEqual([{ key: 'o1', tokens: 15, spendCents: expect.any(Number) }]);
    const byFeature = await repo.breakdown(new Date(0), 'label:feature');
    expect(byFeature).toEqual([{ key: 'chat', tokens: 15, spendCents: expect.any(Number) }]); // non-string 'dropped' was normalized out
  });
  it('persists cache-token breakdown into the recorded event (v1.8-5)', async () => {
    const recorded: any[] = [];
    const repo = { record: async (e: any) => { recorded.push(e); } } as any;
    await withMeter({
      userId: 'u1', model: 'claude-haiku-4-5', repo,
      call: async () => ({ usage: { input_tokens: 100, output_tokens: 40, cache_read_input_tokens: 30, cache_creation_input_tokens: 20 } }),
      extract: (r: any) => ({ in: 100, out: 40, cachedIn: 30, cacheWriteIn: 20 }),
    });
    expect(recorded).toHaveLength(1);
    expect(recorded[0].cachedIn).toBe(30);
    expect(recorded[0].cacheWriteIn).toBe(20);
  });
});
