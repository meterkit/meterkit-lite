import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { linePath } from '../../src/ui/charts/path';
import { LineArea } from '../../src/ui/charts/LineArea';
import { Bars } from '../../src/ui/charts/Bars';
import { Sparkline } from '../../src/ui/charts/Sparkline';

describe('linePath', () => {
  it('maps values into a normalized SVG path starting with M', () => {
    const d = linePath([0, 10, 5], 100, 50);
    expect(d.startsWith('M0.00,50.00')).toBe(true);
    expect(d).toContain('L50.00,0.00');   // peak (10) → y=0
    expect(d).toContain('L100.00,25.00'); // 5 of max 10 → mid height
  });

  it('returns an empty string for no values', () => {
    expect(linePath([], 100, 50)).toBe('');
  });
});

describe('LineArea', () => {
  it('renders an accessible svg with line and area paths', () => {
    render(<LineArea values={[1, 3, 2, 5]} label="Spend over time" />);
    const svg = screen.getByTestId('line-area');
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-label', 'Spend over time');
    expect(svg.querySelectorAll('path').length).toBe(2);
  });

  it('renders no paths when there are no values', () => {
    render(<LineArea values={[]} label="empty" />);
    expect(screen.getByTestId('line-area').querySelectorAll('path').length).toBe(0);
  });

  it('renders horizontal gridlines when gridLines is set', () => {
    render(<LineArea values={[1, 2, 3]} label="grid" gridLines={4} />);
    expect(screen.getByTestId('line-area').querySelectorAll('line').length).toBe(4);
  });

  it('marks paths for draw-in animation when animate is set', () => {
    render(<LineArea values={[1, 2, 3]} label="anim" animate />);
    const svg = screen.getByTestId('line-area');
    expect(svg.querySelector('path.mk-chart-line.mk-anim')).not.toBeNull();
    expect(svg.querySelector('path.mk-chart-area.mk-anim')).not.toBeNull();
  });
});

describe('Bars', () => {
  it('renders one rect per value with an accessible label', () => {
    render(<Bars values={[1, 2, 3]} label="By day" />);
    const svg = screen.getByTestId('bars');
    expect(svg).toHaveAttribute('aria-label', 'By day');
    expect(svg.querySelectorAll('rect').length).toBe(3);
  });
});

describe('Sparkline', () => {
  it('renders a single stroked path with an accessible label', () => {
    render(<Sparkline values={[1, 2, 1, 3]} label="trend" />);
    const svg = screen.getByTestId('sparkline');
    expect(svg).toHaveAttribute('aria-label', 'trend');
    expect(svg.querySelectorAll('path').length).toBe(1);
  });
});
