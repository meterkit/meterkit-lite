import { linePath } from './path';

type SparklineProps = {
  values: number[];
  label: string;
  width?: number;
  height?: number;
  className?: string;
};

export const Sparkline = ({ values, label, width = 120, height = 32, className }: SparklineProps) => {
  const line = linePath(values, width, height);
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      data-testid="sparkline"
    >
      {line && (
        <path d={line} fill="none" stroke="var(--mk-accent-2)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  );
};
