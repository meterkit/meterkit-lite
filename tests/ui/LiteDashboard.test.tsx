import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LiteDashboard } from '../../src/ui/LiteDashboard';
import { sampleLiteData } from '../../src/ui/sampleLiteData';

describe('LiteDashboard', () => {
  it('renders the total spend and token count from the sample data', () => {
    render(<LiteDashboard data={sampleLiteData} />);
    // total.spendCents = 1950 → "$19.50"; total.tokens = 1,580,100 → "1.6M"
    // (the KPI row compacts large token counts, mirroring Pro's KpiRow)
    expect(screen.getByText('$19.50')).toBeInTheDocument();
    expect(screen.getByText('1.6M')).toBeInTheDocument();
  });

  it('lists every model in the by-model breakdown', () => {
    render(<LiteDashboard data={sampleLiteData} />);
    // Model keys also appear (fictitiously) in the locked Margin panel, so
    // scope the query to the real, unlocked "By model" breakdown panel.
    const breakdown = screen.getByTestId('breakdown');
    expect(breakdown).toHaveTextContent('gpt-4o');
    expect(breakdown).toHaveTextContent('claude-sonnet-5');
    expect(breakdown).toHaveTextContent('gpt-4o-mini');
    expect(breakdown).toHaveTextContent('claude-haiku-4-5');
  });

  it('shows the "MeterKit Pro" chip on the locked panels', () => {
    render(<LiteDashboard data={sampleLiteData} />);
    const chips = screen.getAllByText('MeterKit Pro');
    expect(chips.length).toBeGreaterThanOrEqual(5); // Quota, Limits, Margin, Forecast, Top spenders, Usage by user
  });

  it('renders the lock glyph over every blocked panel', () => {
    render(<LiteDashboard data={sampleLiteData} />);
    const locks = screen.getAllByText('🔒');
    expect(locks.length).toBeGreaterThanOrEqual(5);
  });

  it('marks locked panel content as inert and hidden from assistive tech', () => {
    render(<LiteDashboard data={sampleLiteData} />);
    const limits = screen.getByTestId('locked-limits');
    const content = limits.querySelector('.mk-locked-content');
    expect(content).toHaveAttribute('aria-hidden', 'true');
    expect(content?.hasAttribute('inert')).toBe(true);
  });
});
