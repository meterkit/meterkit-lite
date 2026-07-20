import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../../src/store/memoryRepo';

describe('memoryRepo', () => {
  it('aggregates tokens and cost per user since a date', async () => {
    const repo = createMemoryRepo();
    const at = new Date('2026-07-01T10:00:00Z');
    await repo.record({ userId: 'u1', model: 'gpt-4o-mini', tokensIn: 100, tokensOut: 50, costCents: 3, at });
    await repo.record({ userId: 'u1', model: 'gpt-4o-mini', tokensIn: 10, tokensOut: 5, costCents: 1, at });
    await repo.record({ userId: 'u2', model: 'gpt-4o-mini', tokensIn: 999, tokensOut: 0, costCents: 9, at });
    const u = await repo.current('u1', new Date('2026-07-01T00:00:00Z'));
    expect(u).toEqual({ tokens: 165, spendCents: 4 });
  });
});

describe('memoryRepo — cache tokens (v1.8-5)', () => {
  it('current() counts cache tokens toward the token total (v1.8-5)', async () => {
    const r = createMemoryRepo();
    const since = new Date(0);
    await r.record({ userId: 'u1', model: 'm', tokensIn: 100, tokensOut: 40, cachedIn: 30, cacheWriteIn: 20, costCents: 5, at: new Date() });
    const usage = await r.current('u1', since);
    expect(usage.tokens).toBe(190); // 100 + 40 + 30 + 20, not 140
  });

  it('top/series/breakdown count cache tokens 1:1 — parity with current() (v1.9)', async () => {
    const r = createMemoryRepo();
    const at = new Date('2026-07-02T10:00:00Z');
    await r.record({ userId: 'uc', model: 'm', tokensIn: 100, tokensOut: 40, cachedIn: 30, cacheWriteIn: 20, costCents: 5, at });
    const since = new Date('2026-07-01T00:00:00Z');
    const top = await r.top(since, 10);
    expect(top.find((x) => x.userId === 'uc')?.usage.tokens).toBe(190);
    const byUser = await r.breakdown(since, 'user');
    expect(byUser.find((x) => x.key === 'uc')?.tokens).toBe(190);
    const series = await r.series({ since: new Date('2026-07-02T00:00:00Z'), until: new Date('2026-07-02T23:00:00Z') }, 'day');
    expect(series[0].tokens).toBe(190);
  });
});

describe('memoryRepo.top', () => {
  it('ranks users by spend within the window, capped at limit', async () => {
    const repo = createMemoryRepo();
    const at = new Date();
    await repo.record({ userId: 'a', model: 'm', tokensIn: 10, tokensOut: 10, costCents: 5, at });
    await repo.record({ userId: 'b', model: 'm', tokensIn: 20, tokensOut: 20, costCents: 50, at });
    await repo.record({ userId: 'c', model: 'm', tokensIn: 5, tokensOut: 5, costCents: 20, at });
    const top = await repo.top(new Date(Date.now() - 60_000), 2);
    expect(top.map((t) => t.userId)).toEqual(['b', 'c']);
    expect(top[0].usage.spendCents).toBe(50);
  });
});

describe('memoryRepo.series', () => {
  it('returns contiguous day buckets with empty days zero-filled', async () => {
    const repo = createMemoryRepo();
    await repo.record({ userId: 'u1', model: 'm', tokensIn: 100, tokensOut: 50, costCents: 3, at: new Date('2026-07-01T09:00:00Z') });
    await repo.record({ userId: 'u2', model: 'm', tokensIn: 10, tokensOut: 0, costCents: 1, at: new Date('2026-07-01T20:00:00Z') });
    await repo.record({ userId: 'u1', model: 'm', tokensIn: 5, tokensOut: 5, costCents: 2, at: new Date('2026-07-03T12:00:00Z') });
    const out = await repo.series({ since: new Date('2026-07-01T00:00:00Z'), until: new Date('2026-07-03T23:59:59Z') }, 'day');
    expect(out).toHaveLength(3);
    expect(out[0]).toEqual({ t: new Date('2026-07-01T00:00:00Z'), tokens: 160, spendCents: 4 });
    expect(out[1]).toEqual({ t: new Date('2026-07-02T00:00:00Z'), tokens: 0, spendCents: 0 });
    expect(out[2]).toEqual({ t: new Date('2026-07-03T00:00:00Z'), tokens: 10, spendCents: 2 });
  });

  it('returns [] for an inverted range', async () => {
    const repo = createMemoryRepo();
    const out = await repo.series({ since: new Date('2026-07-05T00:00:00Z'), until: new Date('2026-07-01T00:00:00Z') }, 'day');
    expect(out).toEqual([]);
  });
});

describe('memoryRepo.breakdown', () => {
  it('groups by model, sorted by spend desc, respecting since', async () => {
    const repo = createMemoryRepo();
    const at = new Date('2026-07-02T10:00:00Z');
    await repo.record({ userId: 'u1', model: 'gpt-4o', tokensIn: 100, tokensOut: 100, costCents: 30, at });
    await repo.record({ userId: 'u2', model: 'gpt-4o-mini', tokensIn: 50, tokensOut: 50, costCents: 5, at });
    await repo.record({ userId: 'u3', model: 'gpt-4o', tokensIn: 10, tokensOut: 10, costCents: 20, at });
    await repo.record({ userId: 'u4', model: 'gpt-4o', tokensIn: 999, tokensOut: 0, costCents: 99, at: new Date('2026-06-01T00:00:00Z') });
    const rows = await repo.breakdown(new Date('2026-07-01T00:00:00Z'), 'model');
    expect(rows).toEqual([
      { key: 'gpt-4o', tokens: 220, spendCents: 50 },
      { key: 'gpt-4o-mini', tokens: 100, spendCents: 5 },
    ]);
  });

  it('groups by user, sorted by spend desc, respecting since', async () => {
    const repo = createMemoryRepo();
    const at = new Date('2026-07-02T10:00:00Z');
    await repo.record({ userId: 'u1', model: 'gpt-4o', tokensIn: 100, tokensOut: 100, costCents: 30, at });
    await repo.record({ userId: 'u2', model: 'gpt-4o-mini', tokensIn: 50, tokensOut: 50, costCents: 5, at });
    await repo.record({ userId: 'u3', model: 'gpt-4o', tokensIn: 10, tokensOut: 10, costCents: 20, at });
    await repo.record({ userId: 'u4', model: 'gpt-4o', tokensIn: 999, tokensOut: 0, costCents: 99, at: new Date('2026-06-01T00:00:00Z') });
    const rows = await repo.breakdown(new Date('2026-07-01T00:00:00Z'), 'user');
    expect(rows).toEqual([
      { key: 'u1', tokens: 200, spendCents: 30 },
      { key: 'u3', tokens: 20, spendCents: 20 },
      { key: 'u2', tokens: 100, spendCents: 5 },
    ]);
  });

  it('groups by org and by a label key, and filters rows before grouping', async () => {
    const repo = createMemoryRepo();
    const at = new Date('2026-07-02T10:00:00Z');
    await repo.record({ userId: 'u1', orgId: 'o1', model: 'm', tokensIn: 10, tokensOut: 10, costCents: 30, labels: { feature: 'chat', customer: 'acme' }, at });
    await repo.record({ userId: 'u2', orgId: 'o1', model: 'm', tokensIn: 5, tokensOut: 5, costCents: 20, labels: { feature: 'chat', customer: 'globex' }, at });
    await repo.record({ userId: 'u3', orgId: 'o2', model: 'm', tokensIn: 1, tokensOut: 1, costCents: 5, labels: { feature: 'embed', customer: 'acme' }, at });

    const byOrg = await repo.breakdown(new Date('2026-07-01T00:00:00Z'), 'org');
    expect(byOrg).toEqual([
      { key: 'o1', tokens: 30, spendCents: 50 },
      { key: 'o2', tokens: 2, spendCents: 5 },
    ]);

    const byFeature = await repo.breakdown(new Date('2026-07-01T00:00:00Z'), 'label:feature');
    expect(byFeature).toEqual([
      { key: 'chat', tokens: 30, spendCents: 50 },
      { key: 'embed', tokens: 2, spendCents: 5 },
    ]);

    // spend per customer within the chat feature
    const chatByCustomer = await repo.breakdown(new Date('2026-07-01T00:00:00Z'), 'label:customer', { labels: { feature: 'chat' } });
    expect(chatByCustomer).toEqual([
      { key: 'acme', tokens: 20, spendCents: 30 },
      { key: 'globex', tokens: 10, spendCents: 20 },
    ]);

    // filter by org
    const o2ByFeature = await repo.breakdown(new Date('2026-07-01T00:00:00Z'), 'label:feature', { orgId: 'o2' });
    expect(o2ByFeature).toEqual([{ key: 'embed', tokens: 2, spendCents: 5 }]);
  });

  it('groups unattributed rows (no org / missing label) under the empty-string key', async () => {
    const repo = createMemoryRepo();
    const at = new Date('2026-07-02T10:00:00Z');
    await repo.record({ userId: 'u1', model: 'm', tokensIn: 10, tokensOut: 0, costCents: 7, at }); // no orgId, no labels
    const byOrg = await repo.breakdown(new Date('2026-07-01T00:00:00Z'), 'org');
    expect(byOrg).toEqual([{ key: '', tokens: 10, spendCents: 7 }]);
    const byFeature = await repo.breakdown(new Date('2026-07-01T00:00:00Z'), 'label:feature');
    expect(byFeature).toEqual([{ key: '', tokens: 10, spendCents: 7 }]);
  });
});

describe('memoryRepo.spendInRange', () => {
  const mk = (userId: string, orgId: string, costCents: number, at: Date) =>
    ({ userId, orgId, model: 'gpt-4o-mini', tokensIn: 1, tokensOut: 1, costCents, at });

  it('sums global spend since a timestamp (exclusive until)', async () => {
    const repo = createMemoryRepo();
    const base = new Date('2026-07-09T10:00:00Z').getTime();
    await repo.record(mk('u1', '', 10, new Date(base)));
    await repo.record(mk('u2', 'o1', 20, new Date(base + 1000)));
    await repo.record(mk('u1', '', 5, new Date(base - 60_000))); // before window
    const total = await repo.spendInRange({ since: new Date(base - 1000) }, {});
    expect(total).toBe(30);
  });

  it('filters by userId and by orgId', async () => {
    const repo = createMemoryRepo();
    const at = new Date('2026-07-09T10:00:00Z');
    await repo.record(mk('u1', 'o1', 10, at));
    await repo.record(mk('u2', 'o1', 20, at));
    const since = new Date('2026-07-09T00:00:00Z');
    expect(await repo.spendInRange({ since }, { userId: 'u1' })).toBe(10);
    expect(await repo.spendInRange({ since }, { orgId: 'o1' })).toBe(30);
  });

  it('honours an exclusive until bound', async () => {
    const repo = createMemoryRepo();
    const base = new Date('2026-07-09T10:00:00Z').getTime();
    await repo.record(mk('u1', '', 10, new Date(base)));
    await repo.record(mk('u1', '', 20, new Date(base + 10_000)));
    const total = await repo.spendInRange(
      { since: new Date(base), until: new Date(base + 5_000) }, {},
    );
    expect(total).toBe(10);
  });
});
