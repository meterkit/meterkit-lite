import type { UsageRepo, UsageEvent, UserUsage, UsageBucket, BreakdownRow, MemberTokenRow, ModelTokenRow } from './usageRepo';
import type { Usage } from '../core/usage';

const MS_HOUR = 3_600_000;
const MS_DAY = 86_400_000;
const bucketSize = (bucket: 'day' | 'hour') => (bucket === 'day' ? MS_DAY : MS_HOUR);

// 1:1 throughput count per event — cache tokens included, matching `current`
// (the quota counter) and billableTokens so every surface reports one number.
const eventTokens = (e: UsageEvent): number =>
  e.tokensIn + e.tokensOut + (e.cachedIn ?? 0) + (e.cacheWriteIn ?? 0);

export const createMemoryRepo = (): UsageRepo => {
  const events: UsageEvent[] = [];
  return {
    async record(e) { events.push({ ...e, orgId: e.orgId ?? '', cachedIn: e.cachedIn ?? 0, cacheWriteIn: e.cacheWriteIn ?? 0, labels: e.labels ?? {} }); },
    async current(userId, since): Promise<Usage> {
      return events
        .filter((e) => e.userId === userId && e.at >= since)
        .reduce<Usage>((acc, e) => ({
          tokens: acc.tokens + eventTokens(e),
          spendCents: acc.spendCents + e.costCents,
        }), { tokens: 0, spendCents: 0 });
    },
    async top(since, limit): Promise<UserUsage[]> {
      const byUser = new Map<string, Usage>();
      for (const e of events) {
        if (e.at < since) continue;
        const prev = byUser.get(e.userId) ?? { tokens: 0, spendCents: 0 };
        byUser.set(e.userId, {
          tokens: prev.tokens + eventTokens(e),
          spendCents: prev.spendCents + e.costCents,
        });
      }
      return [...byUser.entries()]
        .map(([userId, usage]) => ({ userId, usage }))
        .sort((a, b) => b.usage.spendCents - a.usage.spendCents)
        .slice(0, limit);
    },
    async series({ since, until }, bucket): Promise<UsageBucket[]> {
      if (until.getTime() < since.getTime()) return [];
      const size = bucketSize(bucket);
      const start = Math.floor(since.getTime() / size) * size;
      const end = Math.floor(until.getTime() / size) * size;
      const sums = new Map<number, { tokens: number; spendCents: number }>();
      for (const e of events) {
        const t = e.at.getTime();
        if (t < since.getTime() || t > until.getTime()) continue;
        const b = Math.floor(t / size) * size;
        const prev = sums.get(b) ?? { tokens: 0, spendCents: 0 };
        sums.set(b, {
          tokens: prev.tokens + eventTokens(e),
          spendCents: prev.spendCents + e.costCents,
        });
      }
      const out: UsageBucket[] = [];
      for (let b = start; b <= end; b += size) {
        const s = sums.get(b) ?? { tokens: 0, spendCents: 0 };
        out.push({ t: new Date(b), tokens: s.tokens, spendCents: s.spendCents });
      }
      return out;
    },
    async breakdown(since, by, opts): Promise<BreakdownRow[]> {
      const labelKey = by.startsWith('label:') ? by.slice(6) : null;
      const keyOf = (e: UsageEvent): string =>
        by === 'model' ? e.model
        : by === 'user' ? e.userId
        : by === 'org' ? (e.orgId ?? '')
        : (e.labels?.[labelKey as string] ?? '');
      const matches = (e: UsageEvent): boolean => {
        if (e.at < since) return false;
        if (opts?.orgId !== undefined && (e.orgId ?? '') !== opts.orgId) return false;
        if (opts?.labels) {
          for (const [k, v] of Object.entries(opts.labels)) {
            if (e.labels?.[k] !== v) return false;
          }
        }
        return true;
      };
      const sums = new Map<string, { tokens: number; spendCents: number }>();
      for (const e of events) {
        if (!matches(e)) continue;
        const k = keyOf(e);
        const prev = sums.get(k) ?? { tokens: 0, spendCents: 0 };
        sums.set(k, {
          tokens: prev.tokens + eventTokens(e),
          spendCents: prev.spendCents + e.costCents,
        });
      }
      return [...sums.entries()]
        .map(([key, v]) => ({ key, tokens: v.tokens, spendCents: v.spendCents }))
        .sort((a, b) => b.spendCents - a.spendCents);
    },
    async spendInRange({ since, until }, filter): Promise<number> {
      const sinceMs = since.getTime();
      const untilMs = until ? until.getTime() : Infinity;
      let sum = 0;
      for (const e of events) {
        const t = e.at.getTime();
        if (t < sinceMs || t >= untilMs) continue;
        if (filter.userId !== undefined && e.userId !== filter.userId) continue;
        if (filter.orgId !== undefined && (e.orgId ?? '') !== filter.orgId) continue;
        sum += e.costCents;
      }
      return sum;
    },
    async tokensByMember(orgId, { since, until }): Promise<MemberTokenRow[]> {
      const sinceMs = since.getTime();
      const untilMs = until ? until.getTime() : Infinity;
      const sums = new Map<string, { in: number; cachedIn: number; cacheWriteIn: number; out: number }>();
      for (const e of events) {
        const t = e.at.getTime();
        if (t < sinceMs || t >= untilMs) continue;
        if ((e.orgId ?? '') !== orgId) continue;
        const p = sums.get(e.userId) ?? { in: 0, cachedIn: 0, cacheWriteIn: 0, out: 0 };
        sums.set(e.userId, {
          in: p.in + e.tokensIn, cachedIn: p.cachedIn + (e.cachedIn ?? 0),
          cacheWriteIn: p.cacheWriteIn + (e.cacheWriteIn ?? 0), out: p.out + e.tokensOut,
        });
      }
      return [...sums.entries()].map(([userId, s]) => ({
        userId, ...s, total: s.in + s.cachedIn + s.cacheWriteIn + s.out,
      })).sort((a, b) => b.total - a.total);
    },
    async tokensByModel(orgId, { since, until }): Promise<ModelTokenRow[]> {
      const sinceMs = since.getTime();
      const untilMs = until ? until.getTime() : Infinity;
      const sums = new Map<string, { in: number; cachedIn: number; cacheWriteIn: number; out: number }>();
      for (const e of events) {
        const t = e.at.getTime();
        if (t < sinceMs || t >= untilMs) continue;
        if ((e.orgId ?? '') !== orgId) continue;
        const p = sums.get(e.model) ?? { in: 0, cachedIn: 0, cacheWriteIn: 0, out: 0 };
        sums.set(e.model, {
          in: p.in + e.tokensIn, cachedIn: p.cachedIn + (e.cachedIn ?? 0),
          cacheWriteIn: p.cacheWriteIn + (e.cacheWriteIn ?? 0), out: p.out + e.tokensOut,
        });
      }
      return [...sums.entries()].map(([model, s]) => ({
        model, ...s, total: s.in + s.cachedIn + s.cacheWriteIn + s.out,
      })).sort((a, b) => b.total - a.total);
    },
    async deleteOrgData(orgId) {
      for (let i = events.length - 1; i >= 0; i--) if ((events[i].orgId ?? '') === orgId) events.splice(i, 1);
    },
  };
};
