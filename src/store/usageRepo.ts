import type { Usage } from '../core/usage';

export type UsageEvent = {
  userId: string; orgId?: string; model: string;
  tokensIn: number; tokensOut: number;
  cachedIn?: number; cacheWriteIn?: number;
  costCents: number; labels?: Record<string, string>; at: Date;
};

export type UserUsage = { userId: string; usage: Usage };

export type UsageBucket = { t: Date; tokens: number; spendCents: number };

export type BreakdownRow = { key: string; tokens: number; spendCents: number };

export type BreakdownBy = 'model' | 'user' | 'org' | `label:${string}`;
export type BreakdownFilter = { orgId?: string; labels?: Record<string, string> };

export type SpendFilter = { userId?: string; orgId?: string };

export type TokenBreakdown = { in: number; cachedIn: number; cacheWriteIn: number; out: number; total: number };
export type MemberTokenRow = { userId: string } & TokenBreakdown;
export type ModelTokenRow = { model: string } & TokenBreakdown;

export interface UsageRepo {
  record(e: UsageEvent): Promise<void>;
  current(userId: string, since: Date): Promise<Usage>;
  top(since: Date, limit: number): Promise<UserUsage[]>;
  series(range: { since: Date; until: Date }, bucket: 'day' | 'hour'): Promise<UsageBucket[]>;
  breakdown(since: Date, by: BreakdownBy, opts?: BreakdownFilter): Promise<BreakdownRow[]>;
  spendInRange(range: { since: Date; until?: Date }, filter: SpendFilter): Promise<number>;
  tokensByMember(orgId: string, range: { since: Date; until?: Date }): Promise<MemberTokenRow[]>;
  tokensByModel(orgId: string, range: { since: Date; until?: Date }): Promise<ModelTokenRow[]>;
  deleteOrgData(orgId: string): Promise<void>;
}
