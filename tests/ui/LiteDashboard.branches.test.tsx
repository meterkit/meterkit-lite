import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LiteDashboard } from '../../src/ui/LiteDashboard';
import type { LiteDashboardData } from '../../src/ui/sampleLiteData';

const empty: LiteDashboardData = {
  total: { tokens: 0, spendCents: 0 },
  requests: 0,
  series: [],
  byModel: [],
};

const tiny: LiteDashboardData = {
  total: { tokens: 512, spendCents: 250 },
  requests: 42,
  series: [
    { t: new Date(Date.UTC(2026, 6, 20)), tokens: 212, spendCents: 100 },
    { t: new Date(Date.UTC(2026, 6, 21)), tokens: 300, spendCents: 150 },
  ],
  byModel: [{ key: 'gpt-4o-mini', tokens: 512, spendCents: 250 }],
};

const thousands: LiteDashboardData = {
  total: { tokens: 5_500, spendCents: 123_400 },
  requests: 8_200,
  // spendCents ≥ 1000 per bucket exercises the "$12" (rounded dollars) axis
  // label branch of dollarsShort, which the cents-level series never hits.
  series: [
    { t: new Date(Date.UTC(2026, 6, 20)), tokens: 2_500, spendCents: 61_700 },
    { t: new Date(Date.UTC(2026, 6, 21)), tokens: 3_000, spendCents: 61_700 },
  ],
  byModel: [{ key: 'gpt-4o-mini', tokens: 5_500, spendCents: 123_400 }],
};

describe('LiteDashboard — data-shape branches', () => {
  it('shows the empty state when the series has no buckets', () => {
    render(<LiteDashboard data={empty} />);
    expect(screen.getByTestId('usage-trend')).toHaveTextContent('No usage in range');
  });

  it('renders sub-1k token counts unabbreviated and cents-level spend as dollars', () => {
    render(<LiteDashboard data={tiny} />);
    expect(screen.getByText('512')).toBeInTheDocument();
    expect(screen.getAllByText('$2.50').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('abbreviates thousands with the k suffix', () => {
    render(<LiteDashboard data={thousands} />);
    expect(screen.getByText('5.5k')).toBeInTheDocument();
    expect(screen.getByText('8.2k')).toBeInTheDocument();
  });
});
