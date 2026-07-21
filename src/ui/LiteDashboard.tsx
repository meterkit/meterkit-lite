import type { LiteDashboardData } from './sampleLiteData';
import type { UsageBucket, BreakdownRow } from '../store/usageRepo';
import { Sparkline } from './charts/Sparkline';
import { LineArea } from './charts/LineArea';
import { spendDelta } from './kpiDelta';

/* LiteDashboard mirrors the Pro console's exact DOM shape and CSS classes
 * (see meterkit's src/ui/UsageConsole.tsx + KpiRow/UsageTrendChart/
 * SpendCapMeter/TopSpenders/AdminUsageTable for the reference layout — those
 * files are Pro-only and are NOT imported here, only replicated visually).
 *
 * Panels split into two groups:
 *  - LITE panels render real data from `sampleLiteData` / the caller's data.
 *  - PRO panels render the same markup with fixed, fictitious placeholder
 *    numbers, then get wrapped in <LockedPanel> which blurs the content and
 *    overlays a "MeterKit Pro" lock chip. The upsell is the missing
 *    enforcement, not a missing chart — so the shape stays identical. */

const money = (cents: number): string => `$${(cents / 100).toFixed(2)}`;
const nf = new Intl.NumberFormat('en-US');
const compactNum = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
};
const pctOf = (used: number, cap: number): number => (cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0);
const fmtDay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dollarsShort = (cents: number) => (cents >= 1000 ? `$${Math.round(cents / 100)}` : money(cents));

const WARN_PCT = 80;
const GAUGE_R = 15;
const GAUGE_C = 2 * Math.PI * GAUGE_R;

/** Fixed, fictitious numbers for the Pro-only panels. These never come from
 *  real usage — the panels that render them are always locked, so the exact
 *  values only need to look plausible and stay visually stable. */
const PRO_PLACEHOLDER = {
  quotaPct: 82,
  limits: {
    tokenUsed: 820_000, tokenCap: 1_000_000,
    spendUsedCents: 41_200, spendCapCents: 50_000,
  },
  margin: [
    { key: 'gpt-4o', marginCents: 31_200, marginPct: 34 },
    { key: 'claude-sonnet-5', marginCents: 21_000, marginPct: 29 },
    { key: 'gpt-4o-mini', marginCents: 9_800, marginPct: 41 },
    { key: 'claude-haiku-4-5', marginCents: -1_200, marginPct: -8 },
  ],
  forecast: { projectedSpendCents: 61_200, horizon: 7 },
  topSpenders: [
    { userId: 'user_92f3', spendCents: 18_400, tokens: 612_000 },
    { userId: 'user_17ab', spendCents: 14_100, tokens: 487_000 },
    { userId: 'user_04c1', spendCents: 9_600, tokens: 355_000 },
    { userId: 'user_88de', spendCents: 6_800, tokens: 241_000 },
    { userId: 'user_2a7f', spendCents: 4_300, tokens: 168_000 },
  ],
} as const;

/** Blurs `children` and overlays a "MeterKit Pro" lock chip on top. The
 *  wrapped content keeps every class the caller passes (so it renders with
 *  the exact same look as the Pro panel it replicates) plus `mk-locked`,
 *  which anchors the overlay. Content is `aria-hidden` + `inert` since it is
 *  fictitious and must never reach assistive tech or receive focus/clicks. */
const LockedPanel = ({
  as: Tag = 'div',
  className,
  subtitle,
  compact,
  testId,
  children,
}: {
  as?: 'div' | 'section';
  className: string;
  subtitle?: string;
  compact?: boolean;
  testId?: string;
  children: React.ReactNode;
}) => {
  const Element = Tag;
  return (
    <Element className={`${className} mk-locked${compact ? ' mk-locked-compact' : ''}`} data-testid={testId}>
      <div className="mk-locked-content" aria-hidden="true" inert>
        {children}
      </div>
      <div className="mk-locked-overlay">
        <span className="mk-locked-chip">
          <span className="mk-lock-icon" aria-hidden="true">🔒</span>
          <span className="mk-locked-title">MeterKit Pro</span>
        </span>
        {subtitle && <span className="mk-locked-sub">{subtitle}</span>}
      </div>
    </Element>
  );
};

const QuotaGaugePlaceholder = ({ pct }: { pct: number }) => (
  <svg className="mk-quota-gauge" viewBox="0 0 36 36" aria-hidden="true">
    <circle cx="18" cy="18" r={GAUGE_R} fill="none" stroke="var(--mk-surface-3)" strokeWidth="4" />
    <circle
      cx="18" cy="18" r={GAUGE_R} fill="none"
      stroke="var(--mk-accent-2)" strokeWidth="4" strokeLinecap="round"
      strokeDasharray={`${(Math.min(pct, 100) / 100) * GAUGE_C} ${GAUGE_C}`}
      transform="rotate(-90 18 18)"
    />
  </svg>
);

/* ---------- KPI row: Spend / Tokens real, Quota locked, Requests real ---------- */
const KpiRowLite = ({ data }: { data: LiteDashboardData }) => {
  const delta = spendDelta(data.series);
  const sparkValues = data.series.length > 1 ? data.series.map((b) => b.spendCents) : null;
  return (
    <div className="mk-glass mk-kpi-row" data-testid="kpi-row">
      <div className="mk-kpi mk-kpi-hero">
        <div className="mk-kpi-label">Spend</div>
        <div className="mk-kpi-value mk-num">{money(data.total.spendCents)}</div>
        {delta && (
          <div className={`mk-kpi-delta mk-num${delta.pct < 0 ? ' mk-kpi-delta-down' : ''}`} data-testid="kpi-delta">
            {delta.pct >= 0 ? '+' : ''}{delta.pct}% vs prev {delta.windowDays}d
          </div>
        )}
        {sparkValues && <Sparkline values={sparkValues} label="Spend trend" className="mk-kpi-spark" />}
      </div>
      <div className="mk-kpi">
        <div className="mk-kpi-label">Tokens</div>
        <div className="mk-kpi-value mk-num">{compactNum(data.total.tokens)}</div>
      </div>
      <LockedPanel as="div" className="mk-kpi mk-kpi-magenta" compact testId="locked-quota">
        <div className="mk-kpi-label">Quota</div>
        <div className="mk-kpi-value-row">
          <div className="mk-kpi-value mk-num">{PRO_PLACEHOLDER.quotaPct}%</div>
          <QuotaGaugePlaceholder pct={PRO_PLACEHOLDER.quotaPct} />
        </div>
      </LockedPanel>
      <div className="mk-kpi">
        <div className="mk-kpi-label">Requests</div>
        <div className="mk-kpi-value mk-num">{compactNum(data.requests)}</div>
      </div>
    </div>
  );
};

/* ---------- Spend trend chart (real data) ---------- */
const TrendPanel = ({ series }: { series: UsageBucket[] }) => {
  if (series.length === 0) {
    return <div className="mk-glass mk-chart mk-muted" data-testid="usage-trend">No usage in range</div>;
  }
  const values = series.map((b) => b.spendCents);
  const max = Math.max(...values, 1);
  const last = series.length - 1;
  return (
    <figure className="mk-glass mk-chart" data-testid="usage-trend">
      <figcaption className="mk-panel-title">Spend · last {series.length} buckets</figcaption>
      <div className="mk-chart-body">
        <div className="mk-chart-ylabels mk-num" aria-hidden="true">
          <span>{dollarsShort(max)}</span>
          <span>{dollarsShort(max / 2)}</span>
          <span>$0</span>
        </div>
        <div className="mk-chart-plot">
          <LineArea values={values} label="Spend over time" className="mk-chart-svg" gridLines={4} animate />
          <div
            className="mk-chart-dot mk-chart-dot-last"
            style={{ left: `${last > 0 ? 100 : 0}%`, top: `${100 - (values[last] / max) * 100}%` }}
            aria-hidden="true"
          />
          <div className="mk-chart-pill mk-num" aria-hidden="true">{money(values[last])}</div>
        </div>
      </div>
      <div className="mk-chart-axis mk-muted mk-num">
        <span>{fmtDay(series[0].t)}</span>
        {series.length > 2 && <span>{fmtDay(series[Math.floor(last / 2)].t)}</span>}
        {series.length > 1 && <span>{fmtDay(series[last].t)}</span>}
      </div>
    </figure>
  );
};

/* ---------- By model (real data) ---------- */
const ByModelPanel = ({ rows }: { rows: BreakdownRow[] }) => {
  const maxSpend = Math.max(...rows.map((r) => r.spendCents), 1);
  return (
    <div className="mk-glass mk-breakdown" data-testid="breakdown">
      <div className="mk-panel-title">By model</div>
      <ol>
        {rows.map((r) => (
          <li key={r.key}>
            <span
              className="mk-breakdown-bar"
              style={{ width: `${(r.spendCents / maxSpend) * 100}%` }}
              aria-hidden="true"
            />
            <span className="mk-breakdown-key">{r.key}</span>
            <span className="mk-num">{money(r.spendCents)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

/* ---------- Limits · Pro (locked) ---------- */
const LimitsPanel = () => {
  const { tokenUsed, tokenCap, spendUsedCents, spendCapCents } = PRO_PLACEHOLDER.limits;
  const tokenPct = pctOf(tokenUsed, tokenCap);
  const spendPct = pctOf(spendUsedCents, spendCapCents);
  const badgeState = spendPct >= 100 ? 'over' : spendPct >= WARN_PCT ? 'warn' : 'ok';
  const tokenLevel = tokenPct >= 100 ? ' mk-meter-over' : tokenPct >= WARN_PCT ? ' mk-meter-warn' : '';
  const spendLevel = spendPct >= 100 ? ' mk-meter-over' : spendPct >= WARN_PCT ? ' mk-meter-warn' : '';
  return (
    <LockedPanel as="section" className="mk-glass mk-meter" subtitle="Quotas & spend caps" testId="locked-limits">
      <header className="mk-meter-head">
        <span className="mk-panel-title">Limits · Pro</span>
        <span className={`mk-badge ${badgeState} mk-num`}>
          {money(spendUsedCents)} / {money(spendCapCents)}
        </span>
      </header>
      <div className="mk-meter-item">
        <div className="mk-meter-row">
          <span className="mk-meter-label">Token quota</span>
          <span className="mk-num mk-meter-value">{compactNum(tokenUsed)} / {compactNum(tokenCap)}</span>
        </div>
        <div className={`mk-meter-track${tokenLevel}`}>
          <span className="mk-meter-fill" style={{ width: `${tokenPct}%` }} />
        </div>
      </div>
      <div className="mk-meter-item">
        <div className="mk-meter-row">
          <span className="mk-meter-label">Spend cap</span>
          <span className="mk-num mk-meter-value">{money(spendUsedCents)} / {money(spendCapCents)}</span>
        </div>
        <div className={`mk-meter-track${spendLevel}`}>
          <span className="mk-meter-fill" style={{ width: `${spendPct}%` }} />
        </div>
      </div>
    </LockedPanel>
  );
};

/* ---------- Margin by model (locked) ---------- */
const MarginPanel = () => (
  <LockedPanel className="mk-glass mk-margin" subtitle="Margens por modelo" testId="locked-margin">
    <div className="mk-panel-title">Margin by model</div>
    <ol>
      {PRO_PLACEHOLDER.margin.map((r) => (
        <li key={r.key}>
          <span className="mk-margin-key">{r.key}</span>
          <span className={r.marginCents < 0 ? 'mk-num mk-margin-amount mk-neg' : 'mk-num mk-margin-amount'}>
            {money(r.marginCents)}
          </span>
          <span className={`mk-chip mk-num ${r.marginCents < 0 ? 'mk-chip-neg' : 'mk-chip-pos'}`}>
            {r.marginPct}%
          </span>
        </li>
      ))}
    </ol>
  </LockedPanel>
);

/* ---------- Projected spend (locked) ---------- */
const ForecastPanel = () => (
  <LockedPanel className="mk-glass mk-forecast" subtitle="Projeção de despesa" testId="locked-forecast">
    <div className="mk-panel-title">Projected spend</div>
    <div className="mk-forecast-row">
      <span className="mk-num mk-forecast-value">{money(PRO_PLACEHOLDER.forecast.projectedSpendCents)}</span>
      <span className="mk-forecast-tick" aria-hidden="true">↗</span>
    </div>
    <div className="mk-forecast-caption">next {PRO_PLACEHOLDER.forecast.horizon}d</div>
  </LockedPanel>
);

/* ---------- Top spenders (locked) ---------- */
const TopSpendersPanel = () => (
  <LockedPanel className="mk-glass mk-panel" subtitle="Por utilizador" testId="locked-top-spenders">
    <div className="mk-panel-title">Top spenders</div>
    <ol className="mk-card mk-spenders">
      {PRO_PLACEHOLDER.topSpenders.map((r, i) => (
        <li key={r.userId}>
          <span className="mk-spender-rank mk-num">{i + 1}</span>
          <span className="mk-spender-user">{r.userId}</span>
          <span className="mk-spender-amount mk-num">
            {money(r.spendCents)}
            <span className="mk-spender-tok">{nf.format(r.tokens)} tok</span>
          </span>
        </li>
      ))}
    </ol>
  </LockedPanel>
);

/* ---------- Usage by user (locked) ---------- */
const UsageByUserPanel = () => (
  <LockedPanel className="mk-glass mk-panel" subtitle="Por utilizador" testId="locked-usage-by-user">
    <table className="mk-card mk-usage">
      <caption>Usage by user</caption>
      <thead>
        <tr>
          <th>User</th>
          <th>Tokens</th>
          <th>Spend (¢)</th>
        </tr>
      </thead>
      <tbody>
        {PRO_PLACEHOLDER.topSpenders.map((r) => (
          <tr key={r.userId}>
            <td>{r.userId}</td>
            <td className="mk-num">{nf.format(r.tokens)}</td>
            <td className="mk-num">{r.spendCents}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </LockedPanel>
);

export const LiteDashboard = ({ data }: { data: LiteDashboardData }) => (
  <div className="mk-console mk-lite-dashboard" data-testid="usage-console">
    <div className="mk-console-main">
      <KpiRowLite data={data} />
      <div className="mk-console-mid">
        <TrendPanel series={data.series} />
        <div className="mk-console-side">
          <LimitsPanel />
          <ByModelPanel rows={data.byModel} />
          <MarginPanel />
          <ForecastPanel />
        </div>
      </div>
      <div className="mk-console-bottom">
        <TopSpendersPanel />
        <UsageByUserPanel />
      </div>
    </div>
  </div>
);
