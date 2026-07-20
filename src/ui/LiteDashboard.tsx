import type { LiteDashboardData } from './sampleLiteData';
import { LineArea } from './charts/LineArea';
import { Bars } from './charts/Bars';
import { spendDelta } from './kpiDelta';

const nf = new Intl.NumberFormat('en-US');
const money = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

/** Descriptive usage dashboard: what was spent, not what is allowed. Every
 *  number here is a fact about the past period — the locked slot below is
 *  where Pro renders forward-looking quota/spend-cap meters. The missing
 *  enforcement, not the missing chart, is the upsell. */
export const LiteDashboard = ({ data }: { data: LiteDashboardData }) => {
  const delta = spendDelta(data.series);
  const maxModelSpend = Math.max(...data.byModel.map((m) => m.spendCents), 1);

  return (
    <section className="mk-console mk-lite-dashboard" aria-label="Usage overview">
      <div className="mk-kpi-row mk-glass">
        <div className="mk-kpi mk-kpi-hero">
          <span className="mk-kpi-label">Tokens this period</span>
          <strong className="mk-kpi-value">{nf.format(data.total.tokens)}</strong>
        </div>
        <div className="mk-kpi">
          <span className="mk-kpi-label">Cost this period</span>
          <div className="mk-kpi-value-row">
            <strong className="mk-kpi-value">{money(data.total.spendCents)}</strong>
            {delta && (
              <span className={`mk-kpi-delta${delta.pct < 0 ? ' mk-kpi-delta-down' : ''}`}>
                {delta.pct >= 0 ? '▲' : '▼'} {Math.abs(delta.pct)}% / {delta.windowDays}d
              </span>
            )}
          </div>
        </div>
        <div className="mk-kpi">
          <span className="mk-kpi-label">Models tracked</span>
          <strong className="mk-kpi-value">{data.byModel.length}</strong>
        </div>
        <div className="mk-kpi">
          <span className="mk-kpi-label">Days in window</span>
          <strong className="mk-kpi-value">{data.series.length}</strong>
        </div>
      </div>

      <div className="mk-console-mid">
        <div className="mk-panel mk-glass mk-chart">
          <p className="mk-panel-title">Spend trend</p>
          <div className="mk-chart-body">
            <LineArea
              className="mk-chart-svg"
              values={data.series.map((b) => b.spendCents)}
              label="Spend per day over the trailing window"
              gridLines={4}
              animate
            />
          </div>
        </div>

        <div className="mk-panel mk-glass mk-chart">
          <p className="mk-panel-title">Cost by model</p>
          <div className="mk-chart-body">
            <Bars
              className="mk-chart-svg"
              values={data.byModel.map((m) => m.spendCents)}
              label="Cost by model, highest first"
            />
          </div>
        </div>
      </div>

      <div className="mk-console-bottom">
        <div className="mk-panel mk-glass mk-breakdown">
          <p className="mk-panel-title">Per-model breakdown</p>
          <ol>
            {data.byModel.map((m) => (
              <li key={m.key}>
                <span
                  className="mk-breakdown-bar"
                  style={{ width: `${(m.spendCents / maxModelSpend) * 100}%` }}
                  aria-hidden="true"
                />
                <span className="mk-breakdown-key">{m.key}</span>
                <span className="mk-num">
                  {nf.format(m.tokens)} tok · {money(m.spendCents)}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mk-panel mk-glass mk-lite-locked" role="note" aria-label="MeterKit Pro upsell">
          <span className="mk-lock" aria-hidden="true">🔒</span>
          <div>
            <strong>Quotas &amp; spend caps</strong>
            <p className="mk-muted">
              This is what was spent — not what is allowed. Enforce per-user quotas and hard
              spend ceilings with <b>MeterKit Pro</b>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
