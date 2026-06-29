import React from 'react';

/**
 * Donut — ring chart for storage usage, risk breakdown and confidence. Pass
 * `segments` [{ value, color, label }]; optional center value/label.
 */
export function Donut({
  segments = [],
  size = 140,
  thickness = 16,
  center = null,        // { value, label }
  gap = 2,              // degrees between segments
  style,
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, ...style }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-inset)" strokeWidth={thickness} />
        {segments.map((seg, i) => {
          const frac = seg.value / total;
          const len = Math.max(0, frac * c - gap);
          const dash = `${len} ${c - len}`;
          const el = (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += frac * c;
          return el;
        })}
      </svg>
      {center && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>{center.value}</span>
          {center.label && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-label)', color: 'var(--text-muted)' }}>{center.label}</span>}
        </div>
      )}
    </div>
  );
}
