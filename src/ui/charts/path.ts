/** Build an SVG polyline `d` from values, normalized to a width×height box (y flipped). */
export const linePath = (values: number[], w: number, h: number): string => {
  if (values.length === 0) return '';
  const max = Math.max(...values, 1);
  const stepX = values.length > 1 ? w / (values.length - 1) : 0;
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = h - (v / max) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
};
