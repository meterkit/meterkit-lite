'use client';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

/* Chrome do funil (só demo/site) — réplica do ThemeShell do console Pro:
 * wordmark ◆ MeterKit + badge do plano + período + toggle de tema. O
 * componente <LiteDashboard/> permanece chrome-free (como o UsageConsole Pro);
 * o header e o CTA "Get MeterKit Pro" vivem aqui, na moldura do funil. */

const STORAGE_KEY = 'mk-theme';
type Theme = 'dark' | 'light';

export const DemoShell = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);
  const isLight = theme === 'light';
  const toggle = () => {
    const next: Theme = isLight ? 'dark' : 'light';
    setTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };
  return (
    <main className="mk-demo" data-mk-theme={theme}>
      <div className="mk-demo-bar">
        <span className="mk-wordmark">
          <span className="mk-wordmark-glyph" aria-hidden="true">◆</span>
          MeterKit
        </span>
        <span className="mk-plan-badge mk-num">LITE</span>
        <span className="mk-demo-period">Last 7 days</span>
        <button type="button" className="mk-theme-toggle" aria-pressed={isLight} onClick={toggle}>
          {isLight ? '☾ Dark' : '☀ Light'}
        </button>
        <a className="mk-demo-back" href="https://meterkit.dev">meterkit.dev ↗</a>
      </div>
      {children}
      <div className="mk-cta-wrap">
        <a className="mk-cta-pro" href="https://meterkit.dev">
          Unlock enforcement — Get MeterKit Pro →
        </a>
        <p className="mk-cta-note">
          Quotas, spend caps, credits, budgets &amp; Stripe billing — one-time payment, your code, your data.
        </p>
      </div>
    </main>
  );
};
