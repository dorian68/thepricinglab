import React from 'react';

/**
 * LineChart — terminal price chart. Solid primary line (red by default) with an
 * optional dashed "theoretical" series, gradient area fill, faint grid, and
 * x-axis tick labels. SVG, responsive via viewBox.
 */
export function LineChart({
  data = [],
  theoretical = null,
  width = 560,
  height = 220,
  tone = 'red',
  xLabels = [],
  yTicks = 4,
  area = true,
  padding = { t: 12, r: 12, b: 22, l: 34 },
  style,
}) {
  const color = tone === 'red' ? 'var(--red-500)' : tone === 'green' ? 'var(--green-500)' : tone;
  const id = React.useId();
  const all = theoretical ? data.concat(theoretical) : data;
  const min = Math.min(...all), max = Math.max(...all);
  const span = max - min || 1;
  const iw = width - padding.l - padding.r;
  const ih = height - padding.t - padding.b;

  const toXY = (arr) => arr.map((v, i) => {
    const x = padding.l + (i / (arr.length - 1)) * iw;
    const y = padding.t + ih - ((v - min) / span) * ih;
    return [x, y];
  });
  const path = (arr) => toXY(arr).map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const linePts = toXY(data);
  const areaPath = `${path(data)} L${padding.l + iw} ${padding.t + ih} L${padding.l} ${padding.t + ih} Z`;

  const grid = Array.from({ length: yTicks + 1 }, (_, i) => padding.t + (i / yTicks) * ih);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', ...style }}>
      <defs>
        <linearGradient id={`lc-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* grid */}
      {grid.map((y, i) => (
        <line key={i} x1={padding.l} x2={width - padding.r} y1={y} y2={y} stroke="var(--border-subtle)" strokeWidth="1" />
      ))}
      {/* y labels */}
      {grid.map((y, i) => {
        const val = max - (i / yTicks) * span;
        return (
          <text key={`yl-${i}`} x={padding.l - 6} y={y + 3} textAnchor="end" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--text-dim)' }}>
            {Math.round(val)}
          </text>
        );
      })}
      {area && <path d={areaPath} fill={`url(#lc-${id})`} />}
      {theoretical && (
        <path d={path(theoretical)} fill="none" stroke="var(--blue-500)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.9" />
      )}
      <path d={path(data)} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      {/* x labels */}
      {xLabels.map((lab, i) => {
        const x = padding.l + (i / (xLabels.length - 1)) * iw;
        return (
          <text key={`xl-${i}`} x={x} y={height - 6} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--text-dim)' }}>
            {lab}
          </text>
        );
      })}
    </svg>
  );
}
