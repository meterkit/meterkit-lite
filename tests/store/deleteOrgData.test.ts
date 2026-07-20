import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../../src/store/memoryRepo';

describe('deleteOrgData (memory stores)', () => {
  it('usage: clears usage_events for the org only', async () => {
    const r = createMemoryRepo();
    await r.record({ userId: 'u1', orgId: 'o1', model: 'm', tokensIn: 1, tokensOut: 1, costCents: 5, at: new Date() });
    await r.record({ userId: 'u9', orgId: 'o2', model: 'm', tokensIn: 1, tokensOut: 1, costCents: 7, at: new Date() });
    await r.deleteOrgData('o1');
    expect(await r.spendInRange({ since: new Date(0) }, { orgId: 'o1' })).toBe(0);
    expect(await r.spendInRange({ since: new Date(0) }, { orgId: 'o2' })).toBe(7);
  });
});
