import { linePath } from './path';

type LineAreaProps = {
  values: number[];
  label: string;
  width?: number;
  height?: number;
  className?: string;
  gridLines?: number;
  animate?: boolean;
};

export const LineArea = ({
  values, label, width = 600, height = 160, className, gridLines = 0, animate = false,
}: LineAreaProps) => {
  const line = linePath(values, width, height);
  const area = line ? `${line} L${width.toFixed(2)},${height.toFixed(2)} L0.00,${height.toFixed(2)} Z` : '';
  const anim = animate ? ' mk-anim' : '';
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      data-testid="line-area"
    >
      <defs>
        <linearGradient id="mk-area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--mk-accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--mk-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines > 0 &&
        Array.from({ length: gridLines }, (_, i) => (height * i) / gridLines).map((y) => (
          <line key={y} x1="0" x2={width} y1={y} y2={y} className="mk-chart-grid" vectorEffect="non-scaling-stroke" />
        ))}
      {area && <path d={area} className={`mk-chart-area${anim}`} fill="url(#mk-area-fill)" stroke="none" />}
      {line && (
        <path
          d={line}
          className={`mk-chart-line${anim}`}
          fill="none"
          stroke="var(--mk-accent)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
};
