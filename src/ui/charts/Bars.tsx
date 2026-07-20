type BarsProps = {
  values: number[];
  label: string;
  width?: number;
  height?: number;
  className?: string;
};

export const Bars = ({ values, label, width = 600, height = 160, className }: BarsProps) => {
  const max = Math.max(...values, 1);
  const gap = 2;
  const n = values.length;
  const barW = n > 0 ? (width - gap * (n - 1)) / n : 0;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      data-testid="bars"
    >
      {values.map((v, i) => {
        const h = (v / max) * height;
        return <rect key={i} x={i * (barW + gap)} y={height - h} width={barW} height={h} rx={1} fill="var(--mk-c-cyan)" />;
      })}
    </svg>
  );
};
