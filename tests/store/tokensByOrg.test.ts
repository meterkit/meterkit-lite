import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../../src/store/memoryRepo';

const ev = (over: Partial<Parameters<ReturnType<typeof createMemoryRepo>['record']>[0]>) =>
  ({ userId: 'u1', orgId: 'o1', model: 'm1', tokensIn: 10, tokensOut: 5, cachedIn: 3, cacheWriteIn: 2, costCents: 1, at: new Date(1000), ...over });

describe('tokensByMember / tokensByModel (memory)', () => {
  it('tokensByMember: per-member breakdown + total, org-scoped', async () => {
    const r = createMemoryRepo();
    await r.record(ev({ userId: 'u1', orgId: 'o1' }));
    await r.record(ev({ userId: 'u2', orgId: 'o1', tokensIn: 100, tokensOut: 0, cachedIn: 0, cacheWriteIn: 0 }));
    await r.record(ev({ userId: 'u9', orgId: 'o2' })); // other org, excluded
    const rows = await r.tokensByMember('o1', { since: new Date(0) });
    const u1 = rows.find((x) => x.userId === 'u1')!;
    expect(u1).toEqual({ userId: 'u1', in: 10, cachedIn: 3, cacheWriteIn: 2, out: 5, total: 20 });
    expect(rows.find((x) => x.userId === 'u9')).toBeUndefined();
    expect(rows.find((x) => x.userId === 'u2')!.total).toBe(100);
  });
  it('tokensByModel: per-model breakdown + total, org-scoped', async () => {
    const r = createMemoryRepo();
    await r.record(ev({ model: 'm1', orgId: 'o1' }));
    await r.record(ev({ model: 'm1', orgId: 'o1' }));
    await r.record(ev({ model: 'm2', orgId: 'o1' }));
    const rows = await r.tokensByModel('o1', { since: new Date(0) });
    expect(rows.find((x) => x.model === 'm1')!.total).toBe(40); // 2 * 20
    expect(rows.find((x) => x.model === 'm2')!.total).toBe(20);
  });
  it('respects the until bound', async () => {
    const r = createMemoryRepo();
    await r.record(ev({ at: new Date(1000) }));
    await r.record(ev({ at: new Date(5000) }));
    const rows = await r.tokensByMember('o1', { since: new Date(0), until: new Date(2000) });
    expect(rows).toHaveLength(1);
    expect(rows[0].total).toBe(20);
  });
});
