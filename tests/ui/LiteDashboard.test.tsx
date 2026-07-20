import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LiteDashboard } from '../../src/ui/LiteDashboard';
import { sampleLiteData } from '../../src/ui/sampleLiteData';

describe('LiteDashboard', () => {
  it('renders the total token count from the data', () => {
    render(<LiteDashboard data={sampleLiteData} />);
    // 1,580,100 tokens total → formatted with grouping
    expect(screen.getByText(/1,580,100/)).toBeInTheDocument();
  });

  it('lists every model in the breakdown', () => {
    render(<LiteDashboard data={sampleLiteData} />);
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o-mini')).toBeInTheDocument();
    expect(screen.getByText('text-embedding-3-small')).toBeInTheDocument();
  });

  it('shows the locked Pro upsell slot for quotas & spend caps', () => {
    render(<LiteDashboard data={sampleLiteData} />);
    expect(screen.getByText(/Quotas & spend caps/i)).toBeInTheDocument();
    expect(screen.getByText(/MeterKit Pro/i)).toBeInTheDocument();
  });
});
